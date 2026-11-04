# HomeQuest (StudyQuest + the family)

HomeQuest is StudyQuest (below) grown into a family app: one shared calendar, what each person has to do today and this
week, family plans everyone votes on, homework and chore timers, a dog tracker, a newborn tracker, a school tracker, and a coin shop where StudyQuest points and completed homework buy treats. It reuses StudyQuest's engine,
storage and Supabase sync unchanged. Read **[docs/HOMEQUEST.md](docs/HOMEQUEST.md)** first for the family side; the rest of
this file describes the learning engine underneath.

Try it with fake data, nothing saved: open the app with `?demo=1` (as a parent) or `?demo=maya` (as the child). Add `&baby=expecting` or `&baby=newborn` to see the new-baby plan before and after a birth.

# StudyQuest

A mobile-first study game for a Year 8 learner, built so that new subjects and new games plug into one shared engine.
Maths (the full Year 7 and 8 syllabus plus the Year 4-6 building blocks under it) is done. German is included as a
small sample pack to prove the structure holds for a different kind of subject.

What it does:

- **One points system across every game.** Skill Tower, Sprint and Gap Finder all feed the same XP, levels, streaks and badges. Repeat attempts and improvement pay more than a one-off good run.
- **Knows what she knows.** Every topic is a node in a prerequisite graph. Each answer updates an ability estimate for that topic, with forgetting built in, so old topics come back for revision when they are due.
- **Finds gaps.** Gap Finder tests Year 8 topics and, when one is shaky, steps back down to the Year 7, 6, 5 building blocks under it to find the real cause.
- **Feedback loop.** A flag button on every question: doesn't work, doesn't make sense, not covered in class, too hard, too easy. "Not covered in class" takes that topic out of play until you say it has been taught. Every report carries an id that regenerates the exact question.
- **Parent area.** PIN-protected: progress by topic, week activity, coverage of Year 8, an inbox of her reports (mark fixed with a note she sees), reward goals ("1,500 XP = pizza night"), topic on/off switches, backup and sync.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 (also on your LAN, so open it on a phone)
npm test             # 139 tests: engine, judging, content quality, storage, sync, family calendar, coins and trackers
npm run build        # production build in dist/ (a PWA, installable from the browser)
```

To put it on her phone, host `dist/` on any static host that serves HTTPS (Netlify, Cloudflare Pages, GitHub Pages).
Open the address on her phone and use "Add to Home Screen". Nothing needs a server; the app stores everything on the
device and only syncs if you turn sharing on.

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run audit:content` | Runs every question generator at every level over many seeds and reports broken or suspicious questions. `-- --sample=3` prints examples to read. |
| `npm run triage -- backup.json` | Turns her flagged questions into a work list, regenerating each exact question and grouping by generator. |
| `npm run simulate` | Plays a made-up child through the real planner to check XP pace and Gap Finder behaviour. |
| `npx vite build --mode inline --outDir dist-inline && node scripts/inline-build.mjs page.html` | Builds a single HTML file with no service worker, for hosts that take one page (this is how the preview was made). |
| `/#/dev` in dev mode | A gallery that renders sample questions from every generator, for eyeballing figures and wording. |

## HomeQuest additions

The family layer now also has a **Plan** tab (timed sessions with a Fabulous-style run screen, a brain dump, meal planning and shopping lists) and a **Spelling** game under Learn. See [docs/HOMEQUEST.md](docs/HOMEQUEST.md).

## Where to read next

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the pieces fit, and why.
- [docs/ADDING_A_SUBJECT.md](docs/ADDING_A_SUBJECT.md): adding German, History, English, Science, or a new game.
- [docs/FEEDBACK_LOOP.md](docs/FEEDBACK_LOOP.md): flag to fix, and setting up sharing so her progress and reports reach your phone.

## Honest limits

- **Family (HomeQuest) sync is tested against a fake PostgREST server** that mimics the API and the row-level-security check. The real Supabase project already carries StudyQuest traffic, but the family events have not yet been through it, so watch the first sync on the beta. Until you turn sharing on, everything works locally on the phone; the Data tab can also export a whole-family backup that `npm run triage` reads for the StudyQuest part.
- **The German pack is a sample**, a small scheme of work for Years 7 and 8 written to show the format. Match it to what her school actually teaches before relying on it.
- **The Maths content follows the syllabus you attached**, but question wording and difficulty have been checked by automated audit and by eye on generated samples, not by a teacher. That is exactly what the flag button is for.
- **Angle diagrams are schematic** and say "Not drawn accurately", as on a real exam paper.
- **The parent PIN is a soft lock** to keep a curious child out, not security. Anyone with the phone and some technical skill can get past it.
- **Free-text marking is exact-match** (with accent and case tolerance for German). Long written answers, essays and speaking need a different approach; see the subject matrix in docs/ADDING_A_SUBJECT.md.
