# Travel and alarms (0.10)

HomeQuest can plan journeys with live train times, put travel time in the calendar, warn early about
disruption and ring alarms on the home speakers. The app only records what you want (places, trips, alarms,
settings). The work is done by an optional **home server**: a small service on the family's own computer that
reads the same event log, talks to Home Assistant (speakers, phones) and Realtime Trains (train times), and
writes its plans and status back as ordinary events.

Without a home server nothing changes: the Travel and alarms screen stays hidden and events have no
"Getting there" section.

## What the app stores

All of these are ordinary family events (append-only, latest wins), synced like everything else:

| Event | Written by | What it holds |
| --- | --- | --- |
| `place` | app | A saved place: name, kind (home, work, school, other), nearest station (CRS code), walk to/from the station. |
| `trip` | app | A regular journey that isn't a calendar event (the school run): who, repeat rule, where, arrive-by, heading-home time. |
| `CalEvent.trip` / `CalEvent.alarmMin` | app | Travel and a speaker alarm on a calendar event. |
| `travel-prefs` | app | Each person's home place, minutes from front door to the train, usual way to travel. |
| `alarm` | app | A speaker alarm: who, time, repeat, speakers, stop when they leave home. |
| `alarm-stop` | app | Someone tapped Stop. Keyed `<refId>:<date>`. |
| `home-settings` | app | Quiet hours, travel defaults, the early-alert threshold, how long before to watch, everyone's speakers. |
| `travel-day` | server | One person's legs for one day: leave-by, trains, arrival, planned/disrupted/unknown. |
| `sched-status` | server | Scheduled, ringing, stopped, done or failed, per event/trip/alarm and date. |
| `server-features` | server | What the server can do, its speakers, whose phones are linked. Written at setup and when it changes. |
| `server-ping` / `server-pong` | app / server | Check connection. |

Private calendar events are never seen by the server, so they can't have travel or alarms.

The station picker reads `public.stations` (see `supabase/schema_v4.sql`, run once). Each phone keeps a copy,
refreshed at most monthly, so the picker works offline.

## How planning works (the server)

- **When something changes** (a trip, a place, a setting), the server replans the next 7 days within a minute.
- **Trains** come from Realtime Trains. Each part of a route is a direct train; you choose the change stations
  and the time allowed to change. The server works backwards from the arrive-by time (latest workable trains)
  and forwards from the heading-home time (first workable trains).
- **Chained days**: a person's journeys that day are chained place to place. If the next journey starts after
  the current one ends, they go straight on; otherwise, if "plan the journey home" is on, they go home.
- **Disruption watch**: the evening before (from 19:00), then every 12 minutes from `watchHours` before the
  first leave-by, and every 4 minutes around leave time. If leave-by moves earlier by `alertMin` or more, that
  person gets a phone notification (tagged `hs:` so tapping it opens Travel and alarms), and, if their phone is
  at home outside quiet hours, a spoken update.
- **Announcements**: from 15 minutes before leave-by, for journeys that start at home, the speakers announce
  the trains every 3 minutes until the phone leaves home, someone taps Stop, or 5 minutes after leave-by.
- **Alarms** repeat every 45 seconds until Stop (in HomeQuest, or on the Home Assistant notification), the
  phone leaves home (if linked and "stop when they leave home" is on), or 30 minutes pass.
- **Quiet hours**: nothing plays on the speakers; the phone gets a notification instead.

## Limits

- Direct trains only between the stations you give; a better route you haven't entered won't be found.
- Driving and walking use the minutes typed on the trip (live traffic would need a routing provider).
- The connection time is your setting, not the railway's official minimum.
- Once someone's phone has left home, nothing more is announced for that journey.

## Setting up the server

The reference server lives alongside Mail Radar (container 103): `/opt/homealarm`, service `homeserver`.

- Home Assistant token: `homealarm-connect-ha`. Realtime Trains token: `homealarm-connect-trains`.
- Link a phone for "stop when they leave home": `homeserver-setup link-phone <member-id> <ha-device>`.
- Starter data for the school run: `homeserver-setup school-run <child-id>`.
- Logs (`journalctl -u homeserver`) record outcomes and counts only, never titles, names or places.

## Family assistant (0.11)

- **Pieces**: tools on the home server (container 103, port 8790, MCP, bearer token, firewall: Hermes only); the
  Hermes `homequest` profile (container 102, only those tools); and the bridge the app talks to
  (`homequest-bridge`, `https://<hermes>.ts.net:8443`, tailnet only, checks the family key, one question at a time).
- **Address**: the server publishes it in `server-features.assistantUrl` (env `ASSISTANT_URL` in /etc/homealarm/env).
- **Suggestions**: the assistant can only write `proposal` events. A person taps Add (`proposal-decision`); the server
  makes the change as them and writes `proposal-done` (accepted / rejected / expired / failed). CLI:
  `homeserver-plan suggestions | accept <id> <name> | reject <id> <name>`.
- **Honesty check**: if a reply claims something was suggested but the server recorded nothing new, the bridge
  replaces the claim with "Nothing has been suggested yet".
- **Speed**: about 40-70 seconds an answer on the local model (qwen3 30B); the app waits up to 5.5 minutes.
- Logs record tool names, outcomes and timings only, never questions, answers or arguments.

## Planning help in the event form (0.12)

- The form posts the draft (date, times, member ids, place, mode, changes) to the bridge's `/plan-event`, which passes it
  to the home server's `/api/event-help` (family key checked at both). No language model: about a second.
- Reply: free slots shared by everyone involved (fixed commitments and meals count as busy, with the 10/15-minute gap;
  must-dos and care can move, so they appear as soft clashes instead), clashes with the chosen time, journeys both ways
  per person, and warnings (quiet hours, a child's day running late, having to leave while still busy).
- When editing, the event itself is left out. Repeating events are checked for the date in the form only.
- "Ask the assistant about this" opens the chat with a question about the draft filled in (the event isn't saved).

## Plan for today, morning overview and "on track?" (0.13)

The home server works out each parent's and child's day (the same planner the assistant uses) and writes it as a
`day-plan` event, so Today shows **Plan for today**: what's on now, what's next, spare time and any warnings. It is
rewritten, at most every 5 minutes, when the plan changes.

- **Morning overview.** At 07:00 (each person can pick their own time) the server sends a short notification with the
  day ahead to that person's phone. It never plays on the speakers, waits for quiet hours to end, and is skipped if
  nothing is on.
- **"On track?"** When homework or a task is planned to start, cooking or a dog walk is due, or 20 minutes before
  leaving for a journey, the server writes a `nudge` and sends a notification. At most 6 a day each, none in quiet
  hours, none for a task whose timer is already running. The card on Today offers: *Start now* (starts a timer for
  the task, which is how estimates learn real times), *Already done*, *In 15 min* (asked again, up to twice),
  *Not today*, *Running late* (journeys: tells the other parents) and *Can someone else?* (a parent's job: asks the
  other parents).
- **Settings.** Plan for today → Settings turns the overview and the questions on or off for that person
  (`daily-prefs`).
- On the server, `homeserver-plan morning` shows what each person would get and `homeserver-plan nudges` lists
  today's questions and answers. Logs record counts only.

## The weekly round table (0.14)

Once a week (Sunday at 17:00 by default; parents change it on the Round table screen) the family assistant runs a
round table for the coming week.

1. **The day before, 18:00:** everyone's phone is asked if there's anything to raise. Notes are added on the Round
   table screen (`round-table-note`); anyone can add one.
2. **At the set time:** the home server works out the facts: each day's fixed things, must-dos, free time and
   warnings, time estimates that look wrong, and last week's "on track?" answers and tasks ticked off. It writes a
   `round-table` event with status `waiting`.
3. **The assistant:** the bridge on the Hermes container checks every 5 minutes. When one is waiting, Hermes reads it
   (`round_table` tool), checks problems with the other tools, suggests up to 4 fixes (normal suggestions, nothing
   changes until someone taps Add), answers what was raised, and posts a short agenda (`post_round_table`). Everyone's
   phone is told it's ready.
4. **If the assistant can't:** after 45 minutes the home server posts a plain agenda from the facts.

The Round table screen shows the agenda, the suggested changes, the things raised, the week day by day and last week.
Parents can go on to the weekly summit from there. On the server: `homeserver-plan roundtable` shows it and
`homeserver-plan roundtable start` starts one now (for next week).

## Buses (0.15)

The family's own **OpenTripPlanner** (OTP 2.9) runs in its own container on the home server (CT 104, `otp`,
192.168.86.54:8080, reachable only from the home server's container). It holds:

- the **bus timetables for the South East** from the Bus Open Data Service (Open Government Licence), and
- the **street map of East and West Sussex** from OpenStreetMap (via Geofabrik).

`otp-rebuild` downloads both again and rebuilds the graph every Wednesday at 03:30 (about 5 minutes; bus planning
pauses meanwhile). The home server asks it for door-to-door journeys (walk, bus, changes, walk) when a trip's mode
is **Bus**; the app offers Bus once the server says it can (`server-features.bus`). Bus times are the timetable, not
live. Trains still come from Realtime Trains, which knows about delays and cancellations.

A place needs coordinates for buses: a postcode set on the server (`homeserver-plan place <id> <postcode>`), or
else its station is used as an approximation. Places outside Sussex can't be reached by bus.

Train data in OTP (so a journey could mix bus and train) needs a free National Rail Open Data account and is not set
up.

## Journey times (0.16)

The Times tab on the Travel screen asks the home server (`POST /api/journey`, reached through the assistant bridge's `/journey` route with the family key) how long it takes to get between two saved places, arriving by or leaving at a time. The answer lists walk, bus, train, car and bike with leave-by, arrive and minutes, or why one isn't available. Only place ids, the day and the time leave the phone; coordinates stay on the server.

Walking minutes come from OpenTripPlanner's street map (`otp.Transit.walk`), so they need no TomTom key. An event whose travel is "Walk" fills in its own minutes the same way, unless minutes were typed on the trip.
