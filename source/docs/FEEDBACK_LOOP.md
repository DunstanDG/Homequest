# The feedback loop, and sharing progress with you

The point of the loop: when a question is broken, confusing or not yet taught, she taps one button, and the person who
can fix it gets the exact question and what she said. Then she is told when it is fixed.

```
 she taps the flag  ->  event on her phone  ->  sync (optional)  ->  your Parent area > Reports
                                                                            |
 What's new on her phone  <-  "fixed" event + your note  <-  you fix the generator, bump the version
```

## What she can report

The flag icon (top right of every question) opens a sheet with six choices:

| Choice | What happens |
| --- | --- |
| Doesn't work | Recorded as a bug. The question is never shown to her again. |
| Doesn't make sense | Recorded as confusing wording. Never shown again. |
| Not covered in class | Recorded, and the **topic** is switched off: no game asks about it and her earlier results on it stop counting against her. You switch it back on in Parent area > Topics (or with "It has been taught" on the report) once school has covered it. |
| Too hard / Too easy | Recorded as a difficulty note for that question's generator. That exact question is not shown again. |
| Something else | Free note. |

She can add a short note. Each report earns her a few XP (capped at three a day, so it is a thank-you, not a game to farm).
The question is recorded with its **item id**, for example `maths.ct.radius@1#1861532182`. That is generator, difficulty and
random seed, so the exact question and its correct answer can be regenerated at any time from the current content.

## Working through reports

Open **Parent area > Reports** (needs your PIN). Each report shows the question, the expected answer, her note and the id.

Two ways to fix things:

1. **Copy the open reports** (button at the top). It puts a Markdown list on the clipboard with every open report and its id. Paste it into a Claude chat that has this project and say what you want: "fix these, find the generator from the id prefix". The prefix before the `@` is the generator id, and the generators live in `src/content/<subject>/gen.*.ts`.
2. **Run the triage script** for a tidier work list:
   ```bash
   # in Parent area > Data, tap Export to get a backup file, then:
   npm run triage -- studyquest-sam-2026-09-20.json --out=triage.md
   ```
   It regenerates every reported question from its id, checks it against the current content (so it says "already fixed" if you have changed it since), and groups reports by generator, so one fix clears many. Add `--all` to include reports you already resolved.

After fixing:

1. Run `npm test` and `npm run audit:content`.
2. Bump `version` in the subject's pack (for example `MATHS_VERSION` in `src/content/maths/pack.ts`).
3. Deploy the new build (she gets it the next time she opens the app; it updates itself in the background).
4. In Reports, tap **Resolve...** and choose **Mark fixed**, **Won't fix** or **Not a bug**, with a note ("Rewrote the wording, sorry!"). She sees it under **What's new > Because you told us**.

If a report is "not covered in class", the fix is not code: use **It has been taught** on the report, or the Topics switch, once school has covered the topic.

## Sharing progress with your phone

By default everything stays on her phone. To see her progress and reports on your own phone, you need somewhere both phones
can meet. That is a free Supabase project that you own. There is no server of ours involved.

### One-time setup (about ten minutes)

1. Create a free project at supabase.com. Any region. Note the database password if it asks (you will not need it in the app).
2. In the project, open **SQL editor**, paste the whole of `supabase/schema.sql` from this repository, and run it. It creates one table, `events`, with row-level security switched on.
3. Open **Project settings > API** and copy the **Project URL** and the **anon public key**.
4. Give the app the URL and key. Either:
   - build with them: put `VITE_SUPABASE_URL=...` and `VITE_SUPABASE_ANON_KEY=...` in a `.env` file before `npm run build`, so nobody types them; or
   - type them into the screen in step 5 (and again on your phone at step 6).

### Connecting the phones

5. **Her phone:** Parent area > Data > paste the URL and key (if not built in) > **Turn on sharing**. It shows a **family code** (`hq1.` in HomeQuest, `sq1.` in the original StudyQuest; both work). Everything she has already done is uploaded.
6. **Your phone:** open the same app address, and on the welcome screen choose **Join my family with a code** (StudyQuest: **I'm a parent with a family code**). Paste the code (and the URL and key if not built in) and tap **Connect**. Her progress downloads. Use your own Parent area there: Overview, Topics, Reports, Rewards.

After that both phones sync in the background whenever the app is open and online, and **Sync now** in the Data tab forces it. The sync is
append-only, so nothing either phone does can overwrite or lose the other's data. Reports she raises appear on your phone;
your "fixed" notes and reward goals appear on hers.

### What is stored and who can see it

- Only her **first name**, her answers, and the app's events: attempts, points, feedback and goals. No email, no surname, no location, no analytics.
- The **anon key is public** by design; it sits in the app. What protects the data is the **family key** inside the family code: every read and write must send it in a header, and the row-level-security policies in `schema.sql` only match rows carrying that same key. Treat the family code like a password, and do not post it anywhere.
- Anyone with the code can read and add her events. There is no update or delete permission for the app, only insert and select.
- The Parent PIN is a soft lock against a curious child on her own phone. It is not encryption.

### Changing the family code

There is no "rotate key" button, because a new key needs the old rows cleared first (event ids are unique across the table, so
uploading the same events under a new key would be silently skipped).

1. In Supabase > SQL editor run: `delete from public.events where learner_id = '<the middle part of the code>';`
2. On her phone: Data > **Turn off sharing**, then **Turn on sharing**. That makes a new code and uploads everything again.
3. Re-connect your phone with the new code.

## Known limits

- **The automated tests use a fake PostgREST server** that mimics the header-based policy. The real project has been connected and used by the original StudyQuest site, but the family (HomeQuest) events have only been exercised against the fake server until you use the beta. If sharing shows "Problem", the message after **Last sync** carries the server's response. The usual causes are the URL missing `https://`, the anon key copied with a trailing space, or `schema.sql` not having been run.
- Sync runs while the app is open. It does not push notifications, so you will see new reports next time you open the Parent area.
- Without any server the loop still works: her phone > Export backup > `npm run triage`. It just needs you to move the file.
