# Navigation

`src/app/nav.ts` is the one place that says where everything lives:

- `tabsFor(role)`: the tab bar. Parents: Today, Calendar, Plan, Care, More. Children: Today, Homework, Learn, Shop, More.
- `activeTab`: which tab lights up. Any screen that isn't one of the role's tabs was reached from More, so More lights up.
- `FULLSCREEN` / `NO_ADD`: screens without the tab bar, and screens without the + button (matched on path segments).
- `FEATURES`: every feature, with a label, a one-line description, a link, a group, the roles that see it, an optional
  `show` rule and an optional `badge` count. The More hub (`src/screens/More.tsx`) renders it.

**Adding a feature:** add its route in `App.tsx` and an entry in `FEATURES`. If it has no entry, nobody can find it.
`nav.test.ts` checks that every entry has a label, a description and a link.

Hub links can point at a card inside the Parent area with `?tab=<tab>&s=<section>`. The card needs `id="sec-<section>"`
(for `SectionHead`, pass `id`).

## Children and care

A child's `looksAfter` (People › edit › Helps look after) decides which care jobs show on their Today (`kidCare.tsx`)
and what their Care screen shows. Unset means pets and plants; the baby is only on when a parent turns it on. The Vault
is parents only.
