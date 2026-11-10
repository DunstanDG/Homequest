# Quick capture (0.20)

The **+** button opens on one box. Type a title, then a backslash and the next field:

```
service car\time 1:15 thurs\@ Bill's Bangers
spag bol\thurs\meal dinner\cook Dad
bins out\with Sam\time tues 7pm
renew passport\# Admin\! high
```

The first part is always the title. Each part after a `\` is one field. It can start with the field's name, with or
without a space (`time115 thurs`, `@ bills bangers`, `note: bring the logbook`), or just be a value whose meaning is
obvious (`thurs 6pm`, `Maya`, `dinner`, `School`). A part that can't be placed becomes a note, so nothing typed is lost.

Under the box the app shows what it read (a card with each field and how it was understood, unsure ones in orange),
the kind it guessed (tap Event, Task, Meal or Brain dump to change it), and **the next field worth filling in** with
values to tap. Tapping a value writes it into the text, so the typed form is always on screen and can be learnt.
The **\ next** button types the backslash, which is hidden on phone keyboards.

| Field | Names | Example | Used by |
| --- | --- | --- | --- |
| When | `time`, `when`, `on`, `at`, `day`, `date`, `due` | `time 1:15 thurs`, `tomorrow 6pm`, `next fri 9-11am`, `12/11`, `14 nov`, `tonight` | event, task, meal |
| Where | `@`, `where`, `place` | `@ Bill's Bangers` (matches saved places) | event |
| Who | `with`, `who`, `for`, `+` | `with Maya and Sam`, `with everyone`, `for me` | event (people), task (assignee), dump (owner) |
| How long | `for`, `~`, `long`, `mins` | `for 1h30`, `~45m` | event (sets the end), task, dump |
| Notes | `note`, `notes`, `details` | `note bring the logbook` | all |
| List | `#`, `list` | `# Errands` | dump |
| Priority | `!`, `priority` | `! high`, `! someday` | dump |
| Meal | `meal`, `slot` (or just `dinner`) | `meal lunch` | meal |
| Cook | `cook` | `cook Dad` | meal |
| Serves | `serves` | `serves 4` | meal |
| Type | `is`, `type` | `is meal` | overrides the guess |

How the kind is guessed when nobody picks one: a meal slot, cook, servings or a recipe name makes a **meal**; a time
or a place an **event**; a day or a person a **task**; anything else goes in the **brain dump**. Children get Event
and Task only (the brain dump and meal plan are for parents, as before).

Times without am/pm are read the way people say them at home: 1 to 6 is the afternoon, 7 to 11 the morning
(`115` is 13:15, `9` is 09:00). `0930` and `19:30` are taken as written. An event with a time and no end lasts an hour,
or as long as `for` says.

The rules are pure functions in `src/family/capture.ts` (tested in `capture.test.ts`); the screen is
`src/app/Capture.tsx`. The full forms are still under "Or use a full form" for repeats, reminders, travel and the rest.
