# HomeQuest: the family app

HomeQuest is StudyQuest plus a family layer. Same codebase, same hosting recipe (a static site) and the same Supabase table.

## What is in it

| Tab / screen | What it does |
| --- | --- |
| **Today** | Ordered by what matters now. A parent sees **Needs you** (things to check, the weekly summit from Friday, help wanted, ideas to vote on, the dog's treatment or food running low, homework at risk), then **Now & next** (one timeline of the day: calendar, sessions with a Start button, dinner and timed tasks; finished items fold behind "N earlier"), then **To do**, plans coming up, a Care glance, and small tiles (shopping list in shop mode, "What's for dinner?", daily trivia). A child sees Pack for tomorrow and homework first, then To do, the timeline and StudyQuest. Member chips let you look at anyone's day; "Week ahead" shows the next seven days. |
| **Calendar** | One family calendar with four views: Week, Month, List and **Plans & ideas** (what used to be the Together tab). Filter by person. A "who is busy" lane view for the selected day. Events can be for one person, several, or everyone; all-day or timed; repeating (daily, Mon-Fri, school days, weekly, monthly, yearly); marked busy or not; with a "help wanted" note that anyone can offer to take with "I can help". Deleting a repeating event asks whether it is this day or the whole series. School lessons and clubs appear for the child. Tap a school day to see that day's lessons (room, teacher), clubs and homework due; tap a homework item to see its details and tick it off. "Show each lesson" (in the Filter sheet, when a school is set up) swaps the single "School" block for one row per lesson. |
| **Plan** | Five things under one tab, in two groups: **Do** (Sessions, Projects, Brain dump) and **Home** (Meals, Shopping). The weekly summit is the compass button in the header (with a dot from Friday until it is done). **Projects**: a big goal broken into activities, level by level (by hand, or by asking Gemini, as many levels deep as you like), with "has to wait for" links, groups that can be played on their own, and "Plan sessions" to pack the steps into dated sessions (see docs/PROJECTS.md). **Sessions**: an ordered list of steps with minutes (morning routine, a 20-minute tidy, an admin hour), run on a Fabulous-style screen: the current step counting down in a ring (then counting up in amber if you overrun), what is next, time left overall, when you will be done, and whether you are ahead of or behind plan (and, with a "finish by" time, how much spare time you have). Done, Skip, +1 minute, Pause; the clock is remembered as start times so it survives the phone sleeping. Finishing the last step can tick a linked chore (so a child's morning routine pays coins), and "use my usual times" retimes the steps to what they really take. Sessions can be scheduled and repeat, and then show on the calendar and on Today with a Start button. **Brain dump**: type or paste anything, one per line (`~15` minutes, `@name`, `!` important, `#someday`, `Heading:` lines for lists); sort it into lists later, put an item on a day (it becomes a task) or select several and turn them into a session (ticking the step ticks the item). **Meals**: a week planner (a dinner per night plus optional breakfast/lunch/snack), a starter set of recipes and the new-baby set, a marker for evenings when someone is busy, and "Suggest dinners" (no repeats, quick meals on busy nights, favours ones not had recently). **Shopping**: several lists grouped by shop aisle, quantities that add up ("200 g" + "300 g" = "500 g"), "usuals" chips from what you buy often, one tap to add everything the week's meals need (skipping the pantry basics and anything you say you have), and a big-buttons shop mode that keeps the screen awake. |
| **Plans & ideas** (Calendar) | Family ideas (dinner, day out, movie, game, treat). Everyone votes 👍 🤔 👎 on a compact row; the leading idea opens to show who voted and **Plan it**. A free-slot finder looks at everybody's calendar (weekends first; first three shown, "More times" for the rest) and "Plan it" puts the idea in the calendar for everyone. Old `/together` links redirect here (`#/calendar?v=plans`). |
| **Care** | Baby: **day & night shifts** (who's responsible right now; proposed each week by swapping last week's, confirmed on Care or in the weekly summit's "Who's on nights" step) and a "Coming up" timetable of expected feeds, naps and bedtime (age guidance blended with the baby's own recent pattern) showing whose shift each falls in; feeds (bottle ml, or breast with a live pause/switch-side/stop session that only counts active minutes), nappies, sleep timer, solids, medicine (with an advisory dose-lock warning against the family's own dosing rules), weight, notes, a "when" chip so you can log after the fact, a shift-handover banner ("worth a look" when a feed or nappy is overdue), three 24h pulse rings (feeds/wet/dirty) against NHS-style age targets, an expressed-milk stock card (oldest-first use), day totals, 7-day table and a copyable summary for the health visitor. Dog: a single Feed button that locks after each meal until the next meal's window opens (so it cannot be logged twice), walks (with a timer, wee and poo toggles), water, toilet, flea/worming with a repeat-cycle due reminder, medicine, groom, vet visits with a 7-day upset-tummy/vet history, food stock with a low-stock reminder that offers to add it to the shopping list, notes. Logging a walk or meal ticks a linked chore. A **Reference vault** (linked from Care) holds static things you'd otherwise dig for — NHS numbers, microchip details, passport expiries — masked by default with a reveal toggle. |
| **New baby** (from Care, Today and Family) | A two-week plan for when the baby arrives, built like the school pack: it stays dormant until the baby is born. Day by day: a midwife/health milestone (days 1 to 7), one outdoor and one indoor activity, and the postpartum meal plan (easy, one-handed) with a "Plan it" for each. Activities can go on the calendar or be suggested to the family under Calendar › Plans & ideas. |
| **Learn** | The original StudyQuest (Skill Tower, Sprint, Gap Finder, skills, rewards, news) across **Maths, English, Science, History, Geography, Computer Studies and German**, chosen from a subject grid (or "All subjects" for a mixed daily quest; games are filtered to the subject). A parent's Learn tab opens on each child's progress, with "Play yourself" for their own games (KS3, Years 7–9; see "Learning modules" below), and **Spelling**: rounds from the simplest words upwards from your own word list. Each word shows its definition first, then hints (letter count, first letter, ...) until it is right or skipped. A word spelt right once comes back later, on a schedule that spreads out with each success and jumps back after a miss, with some randomness so it never becomes a predictable loop. Spelling counts towards the day's StudyQuest points (and so coins). The list is `src/spelling/wordlist.txt`; editing it needs a rebuild. |
| **School** (from Family) | The child's timetable (A/B weeks), homework (every open piece with its planned day, "Plan it for me", and a daily homework time), clubs and key dates, open questions, and a way to paste a new school pack. |
| **Shop** | Coin balance and where it came from, the treat list, requests, history. |
| **Timers** | A focus timer for homework or a chore. Keeps counting when the phone sleeps (it stores the start time, not a counter), beeps and buzzes, can be paused, extended and cancelled. Finishing it completes the task. |
| **Parent area** | To do (approve homework and jobs, send back with a note, approve or decline treat requests, mark treats given, bonus or take-off coins), Progress (a child's StudyQuest view), Family (people, school, coin rates, treat list, this phone), Data (sharing, backup). |

## The new-baby plan

Add the baby under Parent area > Family with **Not born yet** and a due date. Until then the plan is a preview: nothing is scheduled and nothing appears on the calendar, and Today shows a countdown.

When the baby arrives, tap **Baby is here** on the New baby screen (or edit the baby and choose **Born**) and enter the birth date and, optionally, the day you came home. From then on:

- **Day 1 is the day after the birth**, unless you enter a different "home from hospital" date. The plan covers days 1 to 14. This is an assumption; change it if your hospital stay was longer.
- The health milestone for each day (days 1 to 7: midwife visit, nappy tracking, feeding, heel prick test, cord check, GP registration) appears on the calendar for the parents as an all-day item. It is a reminder, not a tickable task, and it is general guidance: your own midwife's schedule wins.
- The 28 activities and 8 meals are **suggestions, not scheduled events**. Each has "Plan it" (puts it on the calendar with a time you choose) and "Suggest to the family" (adds it to Plans & ideas for votes). Plans & ideas also has a "More ideas" list of the same activities.
- The plan is bundled in the app (`src/family/arrival/pack.ts`), so changing the wording means a rebuild and redeploy.

Demo: `?demo=1&baby=expecting` or `?demo=1&baby=newborn`.

## How the points feed the family side

One rule: **coins are a pure function of the event log**, so every phone shows the same number.

- **StudyQuest XP becomes coins** at a rate a parent sets (default 10 XP = 1 coin), with a **daily cap** (default 400 XP counted = 40 coins) so grinding does not buy the whole shop. XP from before the day a parent switches coins on is never converted.
- **Homework and chores pay coins** set on each task. If a parent has to check it, the coins show as "waiting" until they approve; a task sent back pays nothing until it is redone.
- **Bonuses** (or take-offs) come from a parent, with a reason.
- **Treats** cost coins. Requesting one reserves the coins immediately; a parent approves (spent) or declines (coins come back), then marks it given.

The maths is in `src/family/economy.ts` and is covered by tests in `src/family/family.test.ts`.

## Does it need different hosting?

No for everything above. It is still a static site and the same Supabase project (one table, `events`). What each family action costs:

- Calendar, votes, timers, trackers, school tracker, coins: **no change**. They are all events in the same log.
- Another phone seeing an update **instantly**: built, using Supabase Realtime Broadcast as a "poke" (see "Instant updates" below). No table or policy change. Phones still sync on open and every 25 seconds as a backstop.
- **Notifications** are built (Web Push via a Supabase Edge Function and pg_cron; see `docs/PUSH_NOTIFICATIONS.md`): medicine, tasks, sleep, feeds, calendar, plus the live "feed in progress" notification. Not yet covered: "someone asked for help", task hand-offs, treat requests, shift changes.
- A calendar feed for Apple/Google Calendar (`.ics`) needs a server function. Not built.
- **Photos** (homework photos, baby photos) need Supabase Storage. Not built.
- Real accounts per person (for a grandparent or childminder on their own device) would need Supabase Auth and better row-level security. Today anyone with the family code can read and write everything.

## Setting it up on real phones

1. Deploy `dist/` (or the beta zip) to a **new** Netlify site. A different site means a different origin, so the beta never touches the live StudyQuest data on the phones.
2. First phone: open the beta, choose **Join my family with a code**, and paste the existing StudyQuest family code (`sq1...`). Her history downloads. Pick her name on "Who is this phone?".
3. Parent's phone: same, and pick yourself.
4. Parent area > Family > add the other parent, the baby and the dog, and turn the earlier StudyQuest players into children with **Add <name> as a child**.
5. Parent area > Family > **Start coins today**. Set the treat list and any coin values on tasks.
6. Set a PIN on each child's phone first (Parent area > Family > This phone). On your own phone switch on **Skip the PIN on this phone**.

## Things to know before you rely on it

- **Security is "soft trust".** The PIN keeps a curious child out of the parent area on her own phone. Any phone that has the family code can read and write everything, including approving coins. That is fine for a household and not fine beyond one.
- **No personal data is built into the app.** The app's code is public on whatever site hosts it, so it contains no real school, names or family details: a school pack is pasted in on the School screen (School > Set up) and kept in the family's own synced data in Supabase, readable only with the family code. `src/family/school/sample.ts` is a made-up school used by the demo and the tests. The Supabase URL and the public (anon / publishable) keys in the build are meant to be public; the row-level security on every table is what protects the data.
- **The A/B week pattern after Christmas is assumed** (the rule is "consecutive, skip holidays"). Check the week label on the School tab in January and tap the right letter under "Is this the right week?" if it is wrong. Club length is assumed to be 60 minutes.
- **The German sheet** in the source material was empty, so nothing has been imported for German beyond the sample pack.
- **Concurrent treat requests.** Two phones can both reserve coins before they sync; the balance can then go below zero. The parent's To do tab shows a "not enough coins" warning on those requests, but does not block the approval.
- **Phone clocks.** Everything is ordered by each phone's clock. A parent's approval made on a phone whose clock is a little behind is held and still applied; a phone that is hours out will stamp things in the wrong order, so keep the clocks on automatic.
- **Demo mode** (`?demo=1`, `?demo=maya`) ships in the bundle. It uses throw-away in-memory storage, ignores any sync settings and cannot touch real data.

## Sessions, brain dump, meals and shopping: things to know

- **Sessions are saved plans; a run is one go.** Editing a session later never rewrites a run already done (the steps are copied into the run). The run's clock only counts time while it is running, so pausing (or the phone sleeping) does not eat into a step. A run left open for more than eight hours is treated as forgotten.
- **Coins from a session** come from a chore linked to it. The linked chore is created for you when a child owns the session and you switch on coins. Only that child finishing it pays out, and only on days the session is due.
- **The brain dump keeps your order** (the order you thought of things) within each importance level. Deleting or dropping an item that is on someone's day also takes it off their list.
- **One meal per night and slot.** "Shop list" adds a meal's ingredients once (the meal is then marked "shopped for"); change the recipe or servings and it counts as new again, changing only the cook or notes does not.
- **Two phones editing the same shopping item or meal at the same moment**: the later edit wins, as everywhere else in the app, so a tick made in the shop can be undone by someone saving an older copy of that item. Ticking is quick and rarely collides in practice.
- **The starter recipes** are ordinary recipes you can edit or delete. They are only added when you press the button.

## Navigation and layout: things to know

- **Five tabs:** Today, Calendar, Plan, Care (only once there's a baby or a pet) and Learn.
- **The + button** (bottom right, on Today, Calendar and Plan) adds a task, an event, something to buy (several at once, separated by commas), a brain-dump thought (parents), an idea for the family to vote on, or jumps to Care for a feed or nappy.
- **Help text** under a heading shows the first time with "Got it", then folds into an ⓘ beside the heading (per phone).
- **The cloud** in a header shows sync: hidden when sync isn't set up, amber while syncing, red on a problem (tap it for Data).
- **Night mode** now covers the whole app (automatic 22:00–06:00). The moon/sun button is on Care, and on Today in the evening.
- **Shopping:** ticked items move to "In the basket" at the bottom; tap an aisle to fold it (for this visit only); the add bar stays at the top while you scroll; the Today tile opens the list in shop mode; when the same thing is on the list twice it offers to merge them.
- **Getting started** on Today can be hidden; it comes back from Parent area › Data › Settings.
- **Faster start:** the learning content and the Learn screens load separately from the family screens, so an app update only re-downloads what changed.

## Welcome tour, setup and "What's new": things to know

- **Welcome tour:** someone who sets up a family or joins one on a phone gets a few swipeable cards (different for
  parents and children; Care only if there's a baby or pet). Skip is always there. "Show me" opens that screen and
  Today then offers "Finish the tour". It can be run again from Parent area › Data › Help and updates.
- **Setup checklist** (parents): add the family, school, sharing between phones, notifications on this phone,
  coins, and optionally AI breakdowns and a first plan. It ticks itself off from the family's data. For a newcomer it
  shows as a slim banner on Today for two weeks (or until done or hidden); it's always in Parent area › Data.
- **What's new:** release notes are written **by day** in `src/app/onboarding/releases.ts` (instructions at the top
  of the file). Deploying several times in a day just adds notes under that day. After an update, Today shows
  "New today · N things"; the sheet shows **that day's changes in detail** (with "Show me" links, small fixes bundled
  as "Plus N fixes") and **the rest of the week as one line per area**. Children only see notes meant for them, and
  notes about a baby, pets, children or school only show to families that have one. The full history, a week at a
  time, is on Learn › What's new (and Parent area › Data › All updates). "Seen" is remembered per person on each
  phone; a brand-new person starts with everything so far marked seen.
- **Updates:** a new version installs in the background and waits. It switches on by itself when the app has only
  just been opened (within 45 seconds), or comes back after 5+ minutes in the background, as long as nothing is
  running (a timer, a feed or pumping session, a Plan session). Otherwise Today shows "Update ready · Restart". After
  a restart, further updates in the next 30 minutes don't ask again (deploys come in bursts); they wait for the next
  quiet moment. iPhones only look for a new version when the app is *launched*, so the app also looks each time it
  comes back to the front (at most every 5 minutes) and every hour while open.
- **Version and "Check for updates":** Parent area › Data › Help and updates shows the version and build time (and
  What's new shows the version line for everyone). The build stamps both in (`__APP_VERSION__`, `__BUILD_TIME__` in
  `vite.config.ts`; the version is `package.json`'s, so bump it for a release) and publishes `version.json` beside
  the app. "Check for updates" asks the browser for a new worker and reads `version.json` uncached: *up to date*,
  *new version ready* (downloaded, waiting: "Update now" switches and reloads), *newer version on the server but this
  phone still serves an old copy* ("Update now" unregisters the worker, clears the app's cached files and reloads from
  `?fresh=`; family data is untouched) or *couldn't reach the server*.
- **One banner at a time** on Today: update ready, then an unfinished tour, then setup, then what's new. ✕ puts it
  off until tomorrow (for What's new it counts as read).

## Edit Today: things to know

- **"Edit Today"** at the bottom of Today lists its sections (Needs you, Now & next, To do, Coming up together,
  Care, the evening brain dump and the small tiles; for children also School and homework and Learning) with ▲ ▼
  to reorder and a switch to hide. **Needs you can move but not be hidden.** "Reset to default" puts it back.
- It's **per person, on this phone** (not synced), and only changes your own view: looking at someone else's day
  shows the default for them. Adults and children have different defaults.
- The timers, a running session and the update/What's new banner always stay at the top. New sections added in
  later releases appear in a custom layout at their default place. The logic is in `src/app/todayLayout.ts`.

## Plants: things to know

- **Care › Plants** (the last chip after the baby and pets, or the only tab when there are neither; the Care tab now
  always shows). Add a plant with a name, a picture, where it lives and, optionally, when it was last watered.
- **Due a water** = not watered for 7 days, or never watered. The one rule lives in `waterEveryDays` in
  `src/family/plants.ts`; plants already have a `variety` field so per-variety rules can slot in later.
- **Watering:** 💧 on a row (with Undo), "Log a watering" for an earlier day inside a plant, or a session step.
  Finishing a "Water <plant>" step in any session counts as watering it; undoing the step undoes it.
- **Due plants into a session:** "Start watering" runs one now with a step per due plant. "Add to a session" adds
  them as steps to a session you have, or makes a **watering session** that has no fixed steps and always waters
  whatever is due when it starts (schedule it in Plan › Sessions, say Sunday mornings).
- **Today:** parents get "N plants need a water" under Needs you, and the Care glance shows how many are due.

## Care screen layout: things to know

- **Top to bottom:** a **Now** card (who's on duty and until when, time since the last feed and nappy, asleep or awake and for how long, the next likely sleep, and the last 24 hours' counts, which turn amber when they're below the usual range for the baby's age), then the **button pad** (Feed, Nappy, Sleep/Awake; the Sleep button opens a sheet like Feed's: start the timer, or log a sleep that already happened; then Solids, Medicine, Weight, Note, Vault), one-tap **repeats** ("Bottle 120 ml again", "Start right side"), **Last 24 hours** (runs across midnight, with a "Yesterday" divider), **Last 7 days** (tap a day for everything that happened, with ‹ › to step back up to 30 days), then the shift rota (folded) and "Coming up" (first three).
- **Feed** has three modes: Breast (timer with side switching, or log one afterwards), Bottle (amount, formula or expressed; expressed milk comes off the stock, which is shown right there with the age of the oldest milk), and **Pump** (timer or log afterwards; side, minutes, amount, fridge or freezer; the amount goes into stock and comes back out if the entry is removed). A forgotten pumping timer closes itself like a forgotten feed, logged without an amount.
- **Nappy** is one button: pick wet, dirty or both inside (dirty asks the colour, skippable).
- **Night mode** (dimmer, warmer colours, bigger buttons) switches on automatically from 22:00 to 06:00 (across the whole app; Care also gets bigger buttons). The moon/sun button cycles automatic → forced on/off → automatic, per phone.
- **The two-week plan** link shows at the top only before the birth and in the first 14 days; after that it's a small link at the bottom.

## Care & dog Tier 1: things to know

- **Same "soft trust" security extends to the Vault.** NHS numbers, microchip details and passport expiries are visible to anyone with the family code, same as everything else in the app — the Vault screen says so plainly rather than pretending to be a locked safe. Values are masked on screen by default (tap the eye to reveal) but that is a screen-privacy convenience, not encryption.
- **Medicine dosing guardrails are advisory only, never a hard stop, and not medical advice.** The dose-lock warning ("already had the daily max", "last dose was less than N hours ago") checks the family's own saved rules over a rolling 24 hours — not calendar-day counting, so a dose at 23:50 and a check just after midnight still see each other. A parent can always log anyway; the app never disables the button. The seeded rules (Calpol, Ibuprofen, Vitamin D drops, and so on) are common UK over-the-counter defaults and are always editable — check them against the product's own leaflet or your GP/pharmacist, especially for weight-based dosing.
- **Pulse-ring targets are general NHS-style newborn guidance, not diagnostic.** The three 24h rings (feeds, wet nappies, dirty nappies) compare today's count against a typical range for the baby's age in days. Falling short colours the ring amber ("worth a look"), never red — Care and Dog screens deliberately never use the app's red/`--bad` colour, so nothing here reads as an alarm. It is a nudge to notice, not a clinical assessment.
- **The dog's Feed lock is one button, not two.** Feeding is modelled as a single physical bowl: once a meal (breakfast or dinner) is logged, the Feed tile locks and shows who fed and when, until the next meal's window opens (06:00 for breakfast, 16:00 for dinner) — this is what stops two people each thinking "has the dog been fed?" and feeding twice. It intentionally unlocks again once the next window opens, even same-day, so a breakfast logged at 7am shows locked all morning and then correctly opens up again for dinner once it's afternoon.
- **Flea/worming and food-stock reminders are date-and-quantity math, not a vet.** The treatment-due banner uses the product's own repeat-cycle (28 days is the usual default, but it is editable per product) from the last logged dose. The "running low" food banner estimates days left from bag weight and the daily amount fed — it is an estimate, not a scale reading.
- **Expressed milk stock is FIFO (oldest-first).** Logging a bottle feed as "expressed" deducts from the oldest lot first (closest to its use-by), and undoing that feed entry puts the milk back in stock.

## Tier 2: things to know

Thirteen features, built in one pass (item 26 — mystery box, streak shields, counter-offers, together meter — was deliberately dropped to the backlog rather than built).

- **Smart nappy logging** asks for a colour only when you log a dirty nappy, and compares it against what's typical for the baby's age in days (`expectedNappyColours`/`isAnomalousNappyColour` in `src/family/care.ts`). An unusual colour (especially red or white) shows a note, never a hard stop — "Skip — just log it" always works.
- **Timer guardrails are advisory toasts, not limits.** Stopping a feed or sleep timer that ran unusually short or long shows a gentle heads-up (`feedDurationHint`/`sleepDurationHint`); nothing is blocked or auto-corrected.
- **Sleeps can be logged after the fact, like a breastfeed.** Sleep › "or log a sleep that already happened": pick how long (15 m to 3 h, or any number of minutes up to 24 h) and when they fell asleep (the same When chips as feeds, with sleep-sized presets, a date and a time). It saves a finished sleep (`at` to `endAt`) exactly like one made by the timer, so the Now card, the 24-hour and 7-day totals, "next sleep" guess and the copyable summary all include it. A sleep that would end in the future is refused (use the timer); one that overlaps another logged sleep only warns. A logged sleep's start and length can be edited with the pencil in the log (same sheet as feeds); the old entry is voided and a corrected copy logged. A sleep that runs past midnight counts on the day it started.
- **Predictive sleep scheduling is a rough guess, always labelled as one.** With no nap history yet it shows nothing; with one nap it falls back to an age-typical wake window; with a pattern of recent naps it uses the rolling average gap instead. Never a schedule.
- **Task hand-off has no notifications** (that's Tier 3 backlog). A task can be marked "could use a hand" and picked up by another adult; the "picked up from X" note and the help flag are ordinary task fields, so they only change when someone explicitly asks for help or claims the task — an unrelated edit (retitling, rescheduling) now preserves them.
- **The weekly summit is a guided walkthrough, not a new place to manage data.** Its steps (what's coming up, what's outstanding, who's on nights — only when there's a baby — meals for the week, anything to agree) link straight back to the calendar, brain dump, meal plan and Plans & ideas — nothing is stored that isn't already stored there, beyond a single "summit done this week" marker.
- **The end-of-day brain dump prompt is per-adult, per-phone.** Each adult sets their own enabled/time (default on, 8pm) in Parent area → Family; it appears once per day, after that time, until dismissed or answered, and dismissing just marks it seen for today.
- **Dietary tags are informational only.** They're set on a recipe and shown on shopping-list items pulled from it, but nothing filters or warns automatically — no automatic exclusion is applied anywhere else.
- **Comments are context-isolated by design.** A thread is scoped strictly to the task or calendar event it was started on (`targetId`) and never appears anywhere else, including on a copy of a recurring event.
- **Exam-condition sandbox mode only does what it can actually enforce.** It always removes hints and retries and shows results only at the end; the "timed" part only applies to games that already have a time limit (Sprint) — Skill Tower has no timer to enforce, so exam mode there is hints/retries only. XP and coins are unaffected either way — this is about practice conditions, not different rewards.
- **The skill map is a visual alternative to the list, same underlying data.** It lays skills out left-to-right by real prerequisite depth; colour is mastery tier, exactly as in the list view. Switching views never changes anything about your progress.
- **Colour-coded calendar lessons** use a stable hash of the subject name, so "Maths" is always the same colour everywhere it appears, with no setup needed.
- **Daily trivia is the same for the whole family on a given day** (a hash of the date picks the card, like the spelling word list), one go per person per day, and pays out a small flat coin reward on completion.
- **Family crowdfunding goals are a voluntary, immediate spend of a member's own coins — no parent approval**, unlike a treat request. A parent creates/edits/removes goals; anyone can chip in whatever they choose (up to what they have available) and watch the shared progress bar fill.

## The calm release (0.18)

The app's purpose, as the family put it: **reduce stress** by making tasks automated and visible, make dealing with them
enjoyable and rewarding, support neurodiverse people, and keep planning big and small things from becoming
overwhelming or triggering. 0.18 reworked the app around that. Each area has its own write-up in `docs/calm/`:

| Area | What changed | Write-up |
| --- | --- | --- |
| Today and tasks | One thing / Three / Everything focus modes (children default to one), progress that only counts up, no "late" or red, Fresh start, children only see their own brain-dump items, no clash warnings for children, First, then | `docs/calm/A-today.md` |
| Rewards | A celebration on every tick (adjustable, calm with low stimulation), Look what you did, family goal bar, a bonus for getting started, forgiving StudyQuest streaks, Shop progress | `docs/calm/B-rewards.md` |
| Comfort and accessibility | `/settings/calm`: text size, readable font, high contrast, low stimulation, no ticking countdowns; the 🌿 Calm button and sheet (breather, one thing today, pause reminders, ask for help); heads-up banners before leaving | `docs/calm/C-access.md` |
| Notifications | Bundled, a daily cap, an optional morning summary, children reminded once, held while someone has paused, kinder words (`supabase/schema_v7.sql`) | `docs/calm/D-notify.md` |
| Planning | Plan a thing templates, Pick 3 for this week, Someday, projects lead with the next step | `docs/calm/E-plan.md` |
| Navigation | One Weekly plan (`/week`) instead of the summit and round table, routines in one place, a short More with search, a Settings screen | `docs/calm/F-nav.md` |

`src/app/calm.ts` holds the shared comfort settings (device-local, `settings.calm`); `docs/calm/CONTRACT.md` is how the
work was split. `npm run audit:layout` checks every screen at iPhone 16 Pro, Pixel 8a and Pixel 9 sizes; add
`&calm=larger+readable` to a persona (e.g. `PERSONAS='1&calm=larger,maya'`) to check with bigger text.

**Home server note:** the home server's "on track?" questions and spoken announcements don't know about the Calm pause
yet. They should skip a member whose latest `calm-pause` event has `until` in the future. That change belongs in the
home server's code, which isn't in this repository.

## One server for every family, by invitation (0.17)

The app is built with the family server's URL and public key (`.env.production`), so nobody types Supabase details any more.
Every family lives in the same project, each in its own space: the family key in the family code scopes every row, exactly as
before. What stops a stranger who finds the app from storing data there is `supabase/schema_v5.sql`:

- **Approved families.** Adding rows (events, push subscriptions, reminders) needs a family key on `public.families`. Running
  the file approves every family already syncing, so nobody is cut off.
- **Invites.** An approved family makes one-time codes (`hqi.` + 12 characters, 14 days, at most 5 waiting) in Parent area ›
  Data › Invite another family. A new family enters one when it turns on sharing (Data, or the optional box when starting a
  family). The co-parent code carries one too, so the other home's sharing comes on when they paste it.
- **Before the SQL is run** the app turns sharing on without an invite, as it always did.
- **Looking after it**: the top of `schema_v5.sql` has the SQL to list families and invites, approve one by hand, remove a
  family or stop all invites. The code is in `src/storage/invites.ts`, `src/app/pairing.ts` (`enableSharing`),
  `src/screens/parent/Data.tsx` and `src/screens/family/Coparenting.tsx`; tests in `src/app/invites.test.ts` and
  `src/storage/schemaInvites.test.ts` (the SQL on a real Postgres).

Limits: the family code is still the only key to a family's data (no per-person accounts), and you, as the project's owner,
can read every family's rows in the dashboard. Train times, alarms and the assistant still only run for families the home
server is set up for.

## Co-parenting (shared child, separate households)

Two households, each running their OWN separate copy of HomeQuest (own family, own event log, own optional Supabase project for their own family sync), can share one child's schedule so a co-parent always knows when the child is with them. The two households' busy-block snapshots for a link live together in ONE shared Supabase project (in practice, whichever household created the link — see below), decentralized and optional exactly as elsewhere: there is no backend of ours. See `docs/ARCHITECTURE.md`'s "Decisions and their reasons" for the full design and why it is deliberately not part of the event log.

- **Set up per child**, in Parent area → Family → "Co-parenting" (`src/screens/family/Coparenting.tsx`): the household that creates the link (needs sharing turned on, since the link's shared table lives on the same server) picks the child, a rotation anchor Monday and which side of it is "here", and gets a code to send to the other parent. The other household needs no Supabase project of its own — pasting the code in ("I have a code from the other parent") fully configures its side, and (0.17) the invite inside the code turns on that home's own sharing if it hadn't already.
- **What crosses over, by default:** just busy/free blocks for that one child, drawn from their own agenda — nothing about siblings, nothing about a parent's own personal events beyond the fact of being busy. School lessons, clubs and closures are always labelled by name (e.g. "School", "Football club") since they aren't private.
- **Sharing full detail** for one event (title, notes, location) is a per-event toggle — "Share details with other home" on the event editor (`src/screens/family/shared.tsx`, `EventSheet`) — shown only when the event involves a child with an active link.
- **"Whose week"** shows on Today (`src/screens/family/Today.tsx`) for any child with an active link, and the other household's published blocks show as a small "At <label>" section on the Calendar day view (`src/screens/family/Calendar.tsx`, `OtherHomeBlocks`).
- **Rewards/coins need nothing extra here.** Each household's coin economy already only ever folds its own family's events — the co-parenting mechanism adds no shared table or code path that touches coins or XP.

## Family sessions: things to know

A family session is the whole household doing a lot of small jobs at once: a house clean, a garden day, a quick tidy. It lives at the top of Plan › Sessions; the code is in `src/family/house/` and the screens in `src/screens/house/`.

- **Rooms and jobs are the family's own list.** The first time a parent opens Plan › Sessions the starter list (`house/starter.ts`: kitchen, dining room, sitting room, hall, bathroom, a room per child, parents' room, office, garden, stairs, nursery, whole house) is added. It is written with fixed ids and times, so two phones seeding at once make one copy, and any later edit wins. Rooms and jobs can be added, renamed, retimed and removed in Plan › Sessions › Rooms & jobs; removed starter rooms and a new child's room can be added back there. No real names belong in `starter.ts`: it is public.
- **A job** has minutes, a youngest age, how deep it goes (quick / standard / deep), "stays done for N days" (0 = every session), optional months it applies in, an optional need (a dog, a baby, plants), an order in the room, whether a cleaner usually does it, optional coins, and an optional tie-in: *plants* (waters the room's due plants; the watering is read from the tick, like a plant session step, so undo takes it back), *dog water* (logs the dog's water), *shopping* (offers to add an item to the list), *board*, *machine* (a note only for now).
- **A saved session** (house clean, quick tidy, garden day, deep clean to begin with) picks the rooms (all indoor, garden, the quick-tidy rooms, or a chosen list, with rooms added later joining automatically), the depth and who usually takes part. "Remember what I've left out" on the setup page saves exclusions for next time. It can be put on the calendar (with a repeat); on that day, and only that day, Today shows a Start button.
- **Setup** (`/house/start/:typeId`): everything due is ticked. Jobs done recently (within their reset days), out of season, deeper than the session, or a cleaner's job (when "We have a cleaner" is on) are folded away under "Not suggested today", ready to be ticked early. Whoever starts it confirms who is taking part and who does what: suggestions are one person per room (a child's own room goes to that child), jobs a person is too young for move to the least busy person old enough, and any single job can be handed to anyone.
- **The run** (`/house/run/:id`) is event-sourced like a personal session: start, assign, job, join, leave, pause, resume, end, folded in `house/run.ts`. Everyone sees the same list and ticks on their own phone. The first tick of a job wins; undo takes back the tick and everything it set going (a pet's water, a child's coins). Pause stops the clock for everyone. Anyone taking part who has a personal session running has it paused when this starts, and resumed when it ends. Someone leaving puts their jobs back up for grabs; "Share out the rest" deals them out again. Only one family session runs at a time. Forgotten ones drop off after 12 hours.
- **Coins**: a child earns a small amount per job by length (1 coin under 5 minutes, 2 under 10, 3 under 20, 5 beyond), or the job's own amount. It is a normal chore task (id `house-<run>-<job>`) with a parent check, so it flows through the usual approvals; a parent ticking for a child approves it straight away. Parents earn nothing; a skipped job earns nothing.
- **The board**: Plan › Sessions › "Board for the week" and the Board button during a run list the week's dinners and what is on each day, to copy onto the whiteboard at the weekly round-table plan.
- Not built yet: timing a washing-machine wait, per-room photos, sharing a quick tidy to a child's phone only.

## School screen: things to know

`src/screens/family/School.tsx` opens on a **Now** tab (the focus day is today until the last lesson ends, then the next school day: lessons, kit to bring, clubs, events; the four homework pieces due soonest with tick and edit; dates and closures in the next three weeks). Homework, Week (timetable, with the week-letter correction folded under "Wrong week letter?"), Clubs and Info follow.

## Check-ins: things to know

A morning and an evening check-in per parent and child (`src/family/checkin/`, screens in `src/screens/checkin/`, styles at the end of `src/house.css`). Babies and pets have none.

- **When it shows:** a card on Today (block `checkin`, after "Needs you") while the person's check-in window is open: morning from `morningFrom` to `morningUntil` (default 06:00 to 12:00), evening from `eveningFrom` (default 18:30) to midnight. Once finished it shrinks to a "done · Open" line. A parent viewing a child's Today sees the child's card and can do it for them (`/checkin/:part?for=<member>`). Each person's windows, an on/off switch and the reminder switch are `checkin-config` events (upsert by member), edited in Parent › Family › Check-ins or from the gear on the check-in.
- **The review is read, never stored** (`review.ts`): the evening looks at what the person did today (tasks, homework, coins for a child, finished sessions, family-session jobs, pets and plants they looked after, and for a parent the baby's day). Morning looks at yesterday's count, a parent's baby night (7pm to 7am), today's list and agenda, dinner and plants, and what carried over. "Still open" tasks can be ticked right there.
- **Untracked activity** (`AddSheet`): a free-text activity becomes a ticked-off one-off chore task (source `checkin:activity`; coins only if the person is a child and the switch is on, still going through the parent check); a pet walked/fed/watered or plants watered use the normal Care logging. For yesterday it is stamped 20:00 so it shows in that day's review.
- **Personal care habits** are the person's own list (`habit` events, upsert; `habit-done` events, append and voidable). Each has a time of day (morning / evening / either) and a repeat (every N days, or chosen weekdays). A habit that is not due (nails done last week) is folded under "Not due yet". No streaks and no coins by design. `STARTER_HABITS` (public, no real names) are copied into a person's own list with ids `hab-<member>-<key>`, so two phones adding the same one converge.
- **Mood** is optional (`checkin` events upsert by member, date and part). A child's mood (and "why", and note) is hidden in the UI from anyone but the child and the parents; this is a screen rule, not encryption, since every phone in the family holds the same event log. An adult's check-in is different: it uses the private mechanism below, so other phones never receive it.
- **Mood "why"** (`CheckinEvent.why`): the evening check-in only, a free-text "What was behind that?" before the best-bit box, optional and skippable (the label says optional unless the mood is Rough or Not great, but it is never required). The best-bit box is unchanged for low moods. Seen by whoever can see the mood, shown as a tap-to-read list under the recent-days strip.
- **Reminders** (`src/app/checkinReminders.ts`) are optional per person and only queue the *next* opening (tag `checkin:<part>:<member>`), cancelled once it is done, resynced when the app is open. A phone that is never opened stops getting them. Type `checkin` in Parent › Data › Notifications.
- **Weekday and weekend** (`dayType.ts`): a child with a school set up has a "weekday" on school days and a "weekend" on every other day (so school holidays and INSET days get the relaxed times); everyone else is Monday to Friday and Saturday/Sunday, since the app holds no work rota. `checkin-config` has an optional `weekend` set of times; `configOf(f, member, type)`, `openPart` and `nextOpenAt` take the day type, and the Today card and the reminders pass it in.
- **Habits and routines** (`routineHabits.ts`): a session can hold a "My habits" step (`habitsSlot`), replaced when it is shown or started by the owner's due, un-ticked habits for that part of the day, in habit order with "before you leave" ones last, or a step can be pinned to one habit (`habitId`). Finishing such a step writes the normal `habit-done` tick (`tickHabit` ignores a second one), so there is one tick shown in the routine and in the check-in; a habit in no routine still shows in the check-in. A habit marked "before you leave" (`leaving`) is its own group at the end of the morning check-in, and is left out of days off when the person gave no out-by time.
- **Routine setup** (`routinePlan.ts`, `RoutineSetup.tsx`): wake / leave / bed for school-or-work days and for days off, a before-you-leave checklist and starter habits. `applyRoutinePlan` writes a `routine-plan` event (the answers) and builds, with fixed ids so a second run updates rather than duplicates, a morning and evening session for each kind of day (`rt-<member>-am-wd`, `-am-we`, `-pm-wd`, `-pm-we`; school-day sessions use `schoolDaysOnly`, day-off ones `offDaysOnly`; adults use Mon–Fri / Sat–Sun), the checklist habits (`hab-<member>-leave-<slug>`), and the check-in windows (open at wake time, evening an hour before bed). An existing Morning or Bedtime session owned by that person is taken over rather than copied: its times are set and a "My habits" step is added, its other steps and coin task are kept. Opened from Parent › Family › Check-ins, from the check-in's settings, or from the check-in card when there is no routine. The morning check-in shows the person's routine for that kind of day with Start, Continue or Done.
- Not built: shift-aware day types (no rota data), a separate "pack for tomorrow" tie-in (it stays its own item), and routines for babies or pets.

## Meals: times, ratings and suggestions

- **Layout.** Breakfast, lunch and dinner are identical rows on each day (a planned meal, or a "Plan lunch" row with one-tap choices: the last few meals used in that slot plus Leftovers, Takeaway, Eating out, Sandwiches, Cereal). Snack is an optional "+ Snack". "Move to another day or meal" in a meal's sheet moves it, or swaps if the target is taken (one batch, so no phone sees half of it).
- **Calendar times.** `MealPlanEvent.start/end` are optional. A meal without its own time follows the family's `meal-times` event (Parent › Family › Meal times; defaults 07:30–08:00, 12:00–13:00, 18:00–19:00), including when those are changed later. Snacks never show. The Calendar has a Meals filter (all / dinner / none; the month grid shows dinner only). Calendar reminders skip meals. The new-baby plan still adds its own meal calendar items (not de-duplicated against planned meals).
- **Ratings** (`mealRatings.ts`): `meal-rating` events (👎 / 😐 / 👍), upsert per person and meal, keyed by recipe or normalised title so "Pizza" next week finds this week's votes. Optional per person (nobody is counted neutral for not voting), shown in the evening check-in (today) and the morning one (yesterday) and on Meals. Like mood, who can see what is a screen rule, not encryption.
- **Suggestions** (`meals.ts suggestMeals`): recency × how liked × how often it has been planned recently × same-weekday habit, with the reason on each; anything two people disliked is held back; past typed-in meals can come back as title-only suggestions once there are about two weeks of history; before that it behaves as it used to (recipes only).

## Private things: things to know

Brain dump items can be private, and an adult's check-ins always are (`src/family/privacy.ts`, `src/storage/privateKeys.ts`, `supabase/schema_v3.sql`).

- **Visibility.** A private event carries `priv: <author's member id>`. Only the author's phone folds it (`visibleTo`), so it is hidden in the app, and with sync it is also hidden in the database: the row has an `owner_key` column and row-level security only returns rows whose `owner_key` matches the `x-member-key` header the phone sends, so other phones are never sent them. Everything made from a private item inherits the flag (`inheritPriv`): the task it becomes, its ticks, sessions it is put into, runs, timers, and voids of those. A private item with a time shows everyone a titleless public "Busy" calendar block (`busy-<taskId>`) belonging to its assignee.
- **Keys.** Each person has a random 128-bit key on their own phone (Parent › Data › Private things, or the Private chip in the brain dump). A second phone takes the key as a code (`hqk1.<member>.<key>`). The key is not in the family's shared data.
- **Key copies (trade-off).** A parent can hold a copy of another person's key so a lost phone can be restored: required for a child before they can use Private (the Private switch stays off until a parent has a copy), optional between adult partners. Copies are handed phone-to-phone as codes; the shared log gets only a `key-copy` event with a fingerprint. Copies are for restoring only: they are never sent in request headers, so a parent's phone never receives a child's private rows, and the app never shows other people's private items. Someone who held a copy and used it by hand in another tool could technically read those rows, so a copy is a trust decision, which is why it is optional for adults.
- **Converting.** An existing shared item can be made private (a private copy is created and the shared one deleted; the shared copy stays in the stored history, which the screen warns about) and back again. If everyone loses every phone with the key and no copy exists, the private things are not recoverable.
- **Deploy order.** Run `supabase/schema_v3.sql` in the Supabase SQL editor **before** deploying the new app. Until the app finds the column (`probePrivateReady`) the Private switch stays off and the key sheet says what to do; with sync switched off it is ready straight away. Older phones ignore the new fields.
- **Known edges.** A routine mixing private and shared items becomes private to its creator. An adult check-in done on a phone without the key is stored shared. Existing check-in history is unchanged.

## Voice logging: things to know

Feeds and nappies by voice through Google Home, Home Assistant and a `log-care` Edge Function. The whole guide, with the Home Assistant YAML and routines, is `docs/VOICE_LOGGING.md`. The command logic is in `supabase/functions/_shared/careCommand.ts` (plain TypeScript shared by the function and the tests); the function inserts ordinary `baby` and `feedrun` events with actor `home` and a `voice` field. `BabyEvent.by` (set in Edit entry › Who) credits a person; an unclaimed voice entry shows "logged by voice". Defaults for "bottle" and the time zone are a `voice-config` event (Parent › Data). The function has its own token and can only log a feed or nappy and start or stop a breast feed timer for one baby. Untested on real speakers. The one-file version for the Supabase dashboard is built with `node scripts/single-file-function.mjs log-care careCommand`.

## Travel and alarms: things to know

- Hidden until the family's home server introduces itself (Parent → Data → Home server shows its status). See TRAVEL_AND_ALARMS.md.
- "Getting there" on an event: how (train, walk, car), where (a saved place), changes on the way, arrive-by, the journey home and speaker announcements. Regular journeys that aren't events (the school run) live in Travel → Trips.
- Travel blocks in the calendar come from the home server and update by themselves; they count as busy and are left out of the 30-minute calendar reminders (the server sends its own leave-time and disruption alerts).
- Stop: the red bar at the top of every screen while something is ringing, the Stop button on Travel → Today, or the phone leaving home.
- Repeats can now be every other week (weekly, Mon–Fri, school days), counted from the start date's week.

## Family assistant: things to know

- More → Family assistant (shown once the home server reports an assistant address, or has made a suggestion). Code: `src/screens/family/Assistant.tsx`, `src/family/travel/assistant.ts`.
- Chat goes straight from the phone to the assistant bridge on the tailnet (`server-features.assistantUrl`, https only), with the family key as `x-family-key`. Each person's chat is kept on their own phone only (last 30 turns).
- Suggestions are `proposal` events from the home server; Add / Not now writes a `proposal-decision` (the first one counts); the server carries it out as that person and writes `proposal-done`. Untouched suggestions expire after 7 days. See TRAVEL_AND_ALARMS.md.

## Where things live



- `src/family/*`: the model (types, events folded into state), recurrence, calendar expansion, the daily task list, economy, care, and `actions.ts` (every write goes through it).
- `src/family/school/*`: the school data types and a made-up sample pack (real packs are pasted in, not built in). `src/family/arrival/*`: the new-baby plan (pack data and the date logic).
- `src/family/routines.ts` (sessions and runs), `dump.ts` (brain dump), `meals.ts`, `mealRatings.ts`, `shopping.ts`, `planning.ts`, `sessionTemplates.ts`, `planActions.ts` (every write for the Plan tab); `src/spelling/*`: the spelling module.
- Family sessions: `src/family/house/` (`house.ts` catalogue and setup rules, `assign.ts` who-does-what suggestions, `run.ts` the run fold, `actions.ts` every write, `agenda.ts` calendar items, `starter.ts` the starter list); `src/screens/house/*` the screens; `src/house.css`.
- Check-ins: `src/family/checkin/` (`checkin.ts` windows and mood, `dayType.ts` weekday/weekend, `habits.ts` the habit rules and starters, `routineHabits.ts` habits inside routines, `routinePlan.ts` routine setup, `routineCard.ts` the check-in's routine, `review.ts` the look back, `actions.ts` every write); `src/screens/checkin/*` the screens; `src/app/checkinReminders.ts`.
- `src/family/care.ts`: baby/dog pure logic — feeds, nappies, pulse rings, handover gaps, medicine dose-lock, expressed-milk FIFO stock, live feed-run sessions. `src/family/dog.ts`: the dog's meal lock, treatment-due and food-stock math. `src/family/careActions.ts`: every write for Care/Dog/Vault.
- `src/screens/plan/*`: the Plan tab (Sessions, run screen, Brain dump, Meals, Shopping, and the cards on Today). `src/screens/spelling/*`: the spelling screens.
- `src/screens/family/*`: the family screens (`Care.tsx`, `careWidgets.tsx` for the pulse rings/banners, `Vault.tsx` for the reference vault). `src/screens/parent/*`: the parent area.
- `src/ui/timers.tsx`: the timer UI. `src/app/demo.ts`: the demo family. `src/care.css`: Care/Dog/Vault styles (the non-alarmist colour palette rule is documented at the top of this file).
- `src/storage/*`, `src/app/syncManager.ts`, `src/app/pairing.ts`: storage and sync (shared with StudyQuest; family code prefix `hq1.`, and `sq1.` still works).
- Co-parenting: `src/family/coparent.ts` (pure logic: rotation, link codes, busy-block projection), `src/storage/coparentSync.ts` (the `shared_busy` PostgREST transport), `src/app/coparentSyncManager.ts` (the push/pull loop), `src/screens/family/Coparenting.tsx` (the settings UI), `supabase/schema.sql` (`shared_busy` table + RLS).
- Tier 2: `src/family/comments.ts` (comment threads), `src/family/trivia.ts` (the daily trivia dataset and picker), `src/screens/family/Summit.tsx` (the weekly summit walkthrough). Coin-goal helpers (`goalTotal`) live in `src/family/economy.ts` alongside `balanceFor`/`ledgerFor`; the family goals UI is in `src/screens/family/Shop.tsx`. The daily trivia and end-of-day brain-dump-prompt cards live in `src/screens/family/Today.tsx`. The skill map's node-graph view is in `src/screens/SkillMap.tsx`; exam-mode wiring is in `src/screens/Play.tsx` and `src/games/QuestionGame.tsx`.

## Day & night shifts: things to know

- **One plan per baby per week**, stored as an upsert (`shift-plan` event, keyed by baby + Monday). A proposal is just a suggestion until someone confirms it; "who's on now" only counts a confirmed plan.
- **The proposal swaps the most recent confirmed week**, looking back past any unplanned weeks, so the overnight shift keeps taking turns. The first ever proposal is the first two parents in order, days first, 07:00–19:00.
- **A plan covers the whole week.** There is no single-night swap yet; adjust the week instead.
- **The "Coming up" timetable is a rough guide, not a schedule.** Feed spacing blends the age-typical gap with the baby's own last 24 hours (once there are 3+ feeds); nap spacing reuses the same blend as the "next sleep" guess. It does not yet know about a sleep timer that is running right now.

## Instant updates: things to know

- **Nothing private goes over Realtime.** When a phone uploads new events it broadcasts an empty "poke" on a channel named from a hash of the family key (`src/storage/realtimePoke.ts`). Phones with the app open pull straight away through the normal, header-checked sync. Streaming the rows themselves (Realtime `postgres_changes`) was ruled out: the `events` row-level security reads the family key from a request header, which Realtime connections don't carry.
- **Only phones with the app open get it.** A phone in the background catches up when reopened, as before; push notifications cover the closed-app case.
- **Needs Realtime's public channels**, which new Supabase projects allow by default. If Parent area → Data says "Instant updates: not connected" on a phone that is online, check the project's Realtime settings haven't been restricted to private channels only. Everything still works without it, just on the 25-second check.
- **Local changes go up after 1.2 seconds** (was 2.5) so a burst of taps is still one upload but the other phone sees it sooner.

## Homework: things to know

- **Homework is still an ordinary task** (kind "homework", the date is the due date). It now also has a **"Do it on" day**, separate from the due date. The task form suggests one: the earliest day before it's due with room after school (clubs and busy calendar items count against the 16:00–20:00 window, 10:00–18:00 at weekends), keeping any one day to 90 minutes of homework including what's already planned. "Plan it for me" on the School screen and in the weekly summit does this for every unplanned piece at once.
- **Where it shows.** A planned piece is on the child's daily list from its planned day (and always from the day before it's due); if it isn't done that day it stays, marked "planned for Tue". An unplanned piece keeps the old behaviour: on the list from a week before it's due. The School screen's Homework tab lists every open piece.
- **The after-school check-in** shows on a child's Today from the end of their last lesson until 21:00 on school days: today's subjects, each with Add (subject filled in, due date defaulting to that subject's next lesson) or None. "That's everything" records the answer and the card goes. A parent viewing the child's day sees it too.
- **The "nothing logged" nudge** uses the school's rule of which subjects set homework in Week A and Week B (`homeworkRules.subjectsA/subjectsB` in the school pack; without them the subjects are picked out of the rule's text). From Thursday, any of those subjects with nothing set that week, and no "None" answer, is named, with Add and None set.
- **Daily homework time** is a repeating session on school days (School → Homework → Daily homework time). Its steps aren't saved: when it starts it takes that day's planned pieces (plus anything late or due tomorrow), and finishing a step ticks that piece off, with the usual parent check and coins.
- **Parents** see a Homework card on their own Today (late, behind plan, due this week, not planned, waiting for a check, nothing logged) and a Homework step in the weekly summit.
- **"Due tomorrow, not done" alerts** go to the child and every parent at 18:00 the evening before, as push notifications (Parent area → Data → "Homework due tomorrow and not done"). Handing it in cancels them.
- **Not automatic from MCAS.** There's no official MCAS API for parents; the only route seen is logging in with a parent's MCAS password from a server and calling the portal's internal endpoints, which would mean storing that password in a server function and could break whenever MCAS changes. Not built.
- **"Not needed"** (`dropped` on the task; `dropHomework`, `restoreHomework` in `actions.ts`, UI in `homeworkAdmin.tsx`): parent-only, reversible, not the same as deleting. A dropped piece is left out of Today, School, approvals, alerts, calendar due items, the check-in "still open", progress and the summit, and listed under "Not needed" on the School Homework tab with Restore. If it had been paid, the coins are taken back, capped at the child's balance (never below zero; the sheet says "5 of 8 coins taken back" when some were spent), recorded as a coin adjustment.
- **Un-tick after approval**: from Today, School (Handed in) and the task sheet, with the coins shown. Implemented as voiding the tick plus a compensating adjustment, so lifetime totals can still include coins the child already spent.

## Learning modules: things to know

- **Subjects.** Maths, English, History, Geography and Computer Studies cover KS3 (Years 7–9 of the England national curriculum, Year 8 first, with a few primary building blocks underneath): 60–70 skills each with a prerequisite graph, and questions generated from data tables at difficulty levels 1–5. Science covers KS3 too, in three parts with their own strands (Biology 45 skills, Chemistry 47, Physics 45; about 730 question generators between them, with calculations, results tables, graphs and self-marked explanations). German covers KS3 as well (80 skills: vocabulary by topic, sounds and spelling, reading texts, translation, culture, and grammar from cases and word order to the perfect, imperfect and future; typed answers accept ae/oe/ue/ss for ä/ö/ü/ß but not a missing umlaut). Religion & Philosophy is not built yet. They follow the national curriculum rather than any one school's schemes of work.
- **Written answers are self-marked.** "Explain why", source questions and short paragraphs can't honestly be auto-marked, so she writes first, then sees a model answer and a checklist and ticks what she covered (`reveal` items, `src/ui/answers/reveal.tsx`). A pass is about half the checklist or more. What she wrote is kept and shown to parents under Parent area → Progress → Writing. Written questions never appear in timed games (Sprint, Meteors), the Gap Finder or exam mode; every skill also has auto-marked questions at levels 2–4.
- **Reading passages and code** appear as figures above the question (`passage` and `code` figure types). Every passage is either original writing for HomeQuest or out of copyright, and says which.
- **Accuracy.** Each subject was written with only facts its author was sure of; disputed or changing figures were left out or given as approximate, and every question has exactly one defensible answer. A random sample of each subject was read through before release. If a question looks wrong, flag it in the game: it comes through to Parent area → Progress → Reports.
- **Adding or checking content:** `npx tsx scripts/content-audit.ts --pack=<subject> --sample=1` prints sample questions for one subject; the gallery at `/#/dev?q=<generator id>&answers=1` (development builds only) shows questions with their real answer widgets.
