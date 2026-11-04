# Voice logging (Google Home)

> **Status: built and tested against a fake database, but untested on real speakers.** The app side and the
> function are covered by automated tests (`src/family/voice.test.ts`, `src/storage/logCare.test.ts`). The Home
> Assistant and Google Home steps below are written from the products' documentation and have not been tried on
> a real speaker, so expect to adjust a menu name or two. Google is also in the middle of moving speakers from
> Assistant to Gemini for Home; check the notes under "Known limits" before you start.

Say a fixed phrase to a Nest speaker and a feed or nappy is logged for the baby, with the time you said it:

| You say | What is logged |
| --- | --- |
| left feed / right feed | a breast feed on that side (no duration) |
| bottle | a bottle feed with your default amount and milk (Parent > Data > Voice logging) |
| wet nappy / dirty nappy / wet and dirty nappy | a nappy |
| start left feed / start right feed | starts the feed timer, same as the Care screen |
| stop the feed | stops whichever breast-feed timer is running (even one started on a phone) and logs the feed with its length and side. If none is running the reply is "No feed running." |

Rules that hold for every phrase: one baby only; feeds and nappies only; the time is when it was spoken; the same
phrase twice within two minutes is ignored (so a routine that fires twice logs once). Entries made this way show
as **logged by voice**. To credit someone, open the entry (pencil) and choose **Who**; "Not sure" puts it back to
"logged by voice". Editing the time of an entry keeps whoever it is credited to.

## How it fits together

```
Nest speaker --(routine: custom phrase)--> Google Home --(turns on a switch)--> Home Assistant
   --(rest_command)--> Supabase Edge Function `log-care` --(inserts events)--> your family's events table --> every phone
```

Google Home routines cannot make web requests themselves and cannot take a spoken value, which is why there is
one fixed phrase per action and a Home Assistant script behind each. The function has **its own token**, separate
from the family code, and can only do the nine things in the table above for the one baby. It cannot read the
family's data back, edit or delete anything, or touch any other kind of entry.

## 1. Put the function in your Supabase project

Secrets (Project Settings > Edge Functions > Secrets, or `supabase secrets set NAME=value`):

- `HOME_LOG_TOKEN` — a long random string, at least 24 characters (for example the output of `openssl rand -hex 24`). Home Assistant sends it as the `x-care-token` header.
- `HOME_FAMILY_KEY` — your family code without the leading `hq1.` (Parent > Data shows the code). This says which family to log into.
- `SERVICE_ROLE_KEY` — the same secret the `send-notifications` function already uses. If you have set that up you already have it.

Deploy, either way:

- **Dashboard:** Edge Functions > Deploy a new function > Via Editor. Name it exactly `log-care`, replace the sample code with the whole of `log-care-function-index.ts` (the single-file version), deploy, and in the function's Details turn **off** "Verify JWT" (the function checks its own token).
- **CLI:** `supabase functions deploy log-care --no-verify-jwt` from the project folder.

Test it from any computer (replace the project reference and token):

```
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/log-care \
  -H "x-care-token: YOUR_TOKEN" -H "content-type: application/json" \
  -d '{"command":"nappy-wet"}'
```

You should get `{"ok":true,"say":"Logged, wet nappy.","logged":1,...}` and the entry appears on the Care screen
within a few seconds. Sending it again straight away returns `"duplicate":true` and logs nothing. Delete the test
entry with its bin button.

The nine command names are `feed-left`, `feed-right`, `bottle`, `nappy-wet`, `nappy-dirty`, `nappy-both`,
`feed-start-left`, `feed-start-right` and `feed-stop`. Anything else is refused. The request may also carry
`"kind":"baby"` (the only kind today; the field is there so a dog's walk or meal could be added later) and, if the
family ever has more than one baby, `"babyId"`.

Open Parent > Data > Voice logging in the app and set the bottle amount, the milk type and your time zone (so a
3 a.m. feed lands on the right day). If you never set them, it is 120 ml formula and Europe/London.

## 2. Home Assistant

You need Home Assistant running at home (a Raspberry Pi, a mini PC or a NAS is fine). In `secrets.yaml`:

```yaml
care_log_token: PASTE_THE_SAME_TOKEN
```

In `configuration.yaml`:

```yaml
rest_command:
  care_log:
    url: "https://YOUR-PROJECT.supabase.co/functions/v1/log-care"
    method: POST
    content_type: "application/json"
    headers:
      x-care-token: !secret care_log_token
    payload: '{"command": "{{ command }}"}'
```

Then one script per phrase, in `scripts.yaml` (on Home Assistant older than 2024.8 write `service:` in place of
`action:`):

```yaml
log_left_feed:       { alias: Log left feed,        sequence: [{ action: rest_command.care_log, data: { command: feed-left } }] }
log_right_feed:      { alias: Log right feed,       sequence: [{ action: rest_command.care_log, data: { command: feed-right } }] }
log_bottle:          { alias: Log bottle,           sequence: [{ action: rest_command.care_log, data: { command: bottle } }] }
log_wet_nappy:       { alias: Log wet nappy,        sequence: [{ action: rest_command.care_log, data: { command: nappy-wet } }] }
log_dirty_nappy:     { alias: Log dirty nappy,      sequence: [{ action: rest_command.care_log, data: { command: nappy-dirty } }] }
log_wet_dirty_nappy: { alias: Log wet and dirty nappy, sequence: [{ action: rest_command.care_log, data: { command: nappy-both } }] }
start_left_feed:     { alias: Start left feed,      sequence: [{ action: rest_command.care_log, data: { command: feed-start-left } }] }
start_right_feed:    { alias: Start right feed,     sequence: [{ action: rest_command.care_log, data: { command: feed-start-right } }] }
stop_feed:           { alias: Stop the feed,        sequence: [{ action: rest_command.care_log, data: { command: feed-stop } }] }
```

Restart Home Assistant (or reload YAML), open Developer tools > Actions, run `script.log_wet_nappy`, and check the
entry appears in the app. If it does not, Settings > System > Logs shows the function's reply.

## 3. Let Google Home see the scripts

Google Home can only trigger things it knows about, so the scripts have to be exposed to it. Pick one:

- **Matter bridge (no subscription).** Install the community add-on `RiDDiX/home-assistant-matter-hub` (follow its README), choose the nine scripts as the entities to expose, then in the Google Home app add the bridge as a Matter device (Devices > Add > Matter-enabled device, with the pairing code the add-on shows). Scripts show up as switches. This is a community project, not Google's or Home Assistant's own; check its README for the current steps and which entity types it supports.
- **Home Assistant Cloud (Nabu Casa).** A paid subscription that links Home Assistant to Google Home; expose the scripts under Settings > Home Assistant Cloud > Google Assistant. Cleanest if you already subscribe.
- **Your own Google cloud project.** Free but fiddly; only worth it if you want neither of the above.

After linking, each script appears in the Google Home app as a device. Give them clear names such as "Log wet nappy".

## 4. One Google Home routine per phrase

In the Google Home app: Automations > Add > Household routine (steps vary a little by app version).

1. **Starter:** "When I say to the Assistant", then type the phrase exactly, for example `wet nappy`. Custom phrases are free text, so a phrase can be anything you like; short and unmistakable works best.
2. **Action:** Adjust home devices > the matching script, turned on.
3. **Reply:** add a "Broadcast" or "Say" step, or choose the "Assistant response" option if your version has it, with the text `Logged`. The function's own reply (such as "No feed running.") is returned to Home Assistant but a routine cannot read it out, so the spoken reply is a fixed one you write here. If the speaker says "Logged" but you get no entry, the routine and the script are fine and the function is where to look.

Repeat for all nine phrases. With "stop the feed" and "start left feed" you may want a phrase that is hard to say by accident.

## Known limits

- **Assistant vs Gemini for Home.** Google removed Assistant from phones on 4 September 2026. Nest speakers still default to Assistant and Gemini for Home is opt-in with no way back, so check that custom-phrase routines still work for you before relying on this, and expect to revisit the routines if you switch. If routines stop working under Gemini, the function and Home Assistant parts are unaffected: only step 4 changes.
- **No spoken values.** "Bottle" logs your default amount. A different amount is a quick edit in the app afterwards.
- **No answer from the function.** The speaker says whatever the routine says, not what the function replied, so a refused command still says "Logged". The Care screen is the check.
- **One baby, feeds and nappies.** Nothing else can be logged by voice.
- **Duplicates.** Two different phones or speakers saying the same phrase within two minutes count as one.
- **Who.** Nobody is credited until you set it with Edit entry > Who (or leave it as "logged by voice").

## Keeping it safe

- The token only lets someone log a feed or nappy for your baby. If it leaks, set a new `HOME_LOG_TOKEN` secret and put the same value in Home Assistant's `secrets.yaml`; nothing else changes. The family code is a separate secret and never goes to Home Assistant or Google.
- Google sees the phrase you speak and the routine, as with any routine. The function only ever receives the command name.
- The function limits itself to 60 requests per 10 minutes per instance.
