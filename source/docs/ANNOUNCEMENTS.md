# Read-outs: any task, said out loud when it's due (0.19)

Any task can be read out loud at its time. On the task form, switch on **🔊 Read it out when it's due**. If the task has
no time yet, one is suggested from the part of the day. The form says where it will be heard, and the task shows
`🔊 16:30` on everyone's list.

What is said starts with the time, said the way people say it, then who and what:

> "It's half past four. Maya, it's time to empty the dishwasher."
>
> "It's seven o'clock. Sam, it's time for Bins out."

Titles that start with a doing word ("Empty…", "Walk…", "Pack…") become "time to …"; anything else becomes "time for …".
Homework adds the subject when the title doesn't already say it.

## When it is (and isn't) read out

- At the task's time, on the day it falls: a one-off on its date, homework on its "Do it on" day, and repeating tasks on
  their days (school-day repeats and skipped days are respected).
- Up to 5 minutes late at most, for a device that was asleep. Never long afterwards: nothing is ever read out as
  "missed".
- Not once it's done.
- Not during quiet hours (Travel and alarms › settings; 21:30-06:30 by default).
- Not for someone on a 🌿 Calm pause.
- Only once. Whoever reads it out first writes a `task-announced` event, and everyone else skips it.

The rules are in `src/family/announce.ts` (`dueAnnouncements`), and the tests in `src/family/announce.test.ts`.

## Where it's heard

### 1. Any phone or tablet (works now)

Settings › **Read-outs** › **This device reads out tasks**. Give it a name ("Kitchen tablet"), and choose a voice
(British English is picked by default), a speed, a soft chime first, and keeping the screen on.

- The device must have HomeQuest **open**, ideally plugged in with the volume up. An old phone or tablet on the
  kitchen side is ideal.
- Browsers only let a page talk after someone has tapped it. So after the app (re)opens, a small **🔊 Tap to turn on
  read-outs** button shows until it's tapped once.
- The device tells the family it's an announcer (an `announcer` event), so the task form can say "It'll be heard on
  the Kitchen tablet".
- **Play it** on the settings screen says the next read-out (or a sample) straight away.

The code is in `src/app/announcer.tsx` (it speaks with the browser's built-in speech; nothing is sent anywhere) and
`src/screens/settings/AnnounceSettings.tsx`.

### 2. The home speakers (needs a home server update)

The home server already talks to the speakers for train times and alarms. Its code isn't in this repository, so the
speakers can't read tasks out until the server learns to. The contract is simple:

1. **Every minute,** find each task where `announce` is true and `time` is set, that falls today (same rules as
   `dueAnnouncements`: one-offs on `date`, homework on `doOn`, repeats via `recur` and `exdates`). It must not be done
   (`task-done` for `${taskId}|${date}`), its time must be in the last 5 minutes, and there must be no `task-announced`
   event with key `${taskId}|${date}`.
2. **Skip** it during quiet hours, and for a member whose latest `calm-pause` has `until` in the future.
3. **Write** `{ type: 'task-announced', key: '${taskId}|${date}', by: 'server' }` first, then speak the text on the
   assignee's speakers (`home-settings` speakers for that member, otherwise the defaults). Use the same wording; the
   function `announcementText()` in `src/family/announce.ts` is plain TypeScript and can be copied.
4. **Advertise it:** add `taskAnnouncements: true` to the `server-features` event. The app then says "the home
   speakers" on the task form, and announcer devices step back so nothing is said twice (each device can choose
   "Here as well as on the speakers").
