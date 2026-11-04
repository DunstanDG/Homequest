/**
 * Demo family for previews and screenshots: opened with ?demo=1 (as a parent) or ?demo=maya (as the child).
 * Runs on throw-away in-memory storage and never syncs, so it cannot touch real data.
 * Dates are relative to today so the screens always look lived-in.
 */
import { makeCalCtx } from '@/family/calendar'
import { hasOwnSchool } from '@/family/checkin/dayType'
import { applyRoutinePlan, planDefaults } from '@/family/checkin/routinePlan'
import { Session } from '@/engine/session'
import { solutionFor } from '@/engine/judge'
import { makeEvent } from '@/engine/make'
import type { AppEvent } from '@/engine/types'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import * as PA from '@/family/projectActions'
import { projectTree } from '@/family/projects'
import { parseDump } from '@/family/dump'
import { STARTER_RECIPES } from '@/family/meals'
import { SESSION_TEMPLATES } from '@/family/sessionTemplates'
import { addDays, startOfWeek, tsOf, weekday, ymdOf } from '@/family/dates'
import { legacyFieldsFor, makeRota } from '@/family/shifts'
import * as CA from '@/family/careActions'
import * as PL from '@/family/plantActions'
import { TREAT_SEEDS } from '@/family/economy'
import { SAMPLE_PACK } from '@/family/school/sample'
import { emptyFamily } from '@/family/project'
import type { Repo } from '@/storage/repo'
import * as TR from '@/family/travel/actions'

const HOUR = 3_600_000
const MIN = 60_000

export async function seedDemo(repo: Repo): Promise<void> {
  const q = new URLSearchParams(location.search)
  const asChild = q.get('demo') === 'maya'
  // ?baby=expecting or ?baby=newborn shows the new-baby plan before and just after the birth.
  const babyMode = q.get('baby')
  const now = Date.now()
  const today = ymdOf(now)
  const ts = (day: string, hm: string) => tsOf(day, hm)
  const d = (n: number) => addDays(today, n)
  // Next occurrence of a weekday (0 = Monday), today included.
  const next = (wd: number) => d((wd - weekday(today) + 7) % 7)
  let t = now - 20 * 24 * HOUR
  const tick = () => (t += 1000)
  const out: AppEvent[] = []
  const push = (e: AppEvent[]) => void out.push(...e)
  const sam = 'sam'
  const alex = 'alex'
  const maya = 'maya'
  const robin = 'robin'
  const biscuit = 'biscuit'

  // ---- people
  push([makeEvent(sam, { type: 'family', name: 'The Harper family' }, tick())])
  push(A.saveMember(sam, { id: sam, name: 'Sam', role: 'parent', colour: '#4cc9f0', emoji: '🧔', active: true }, tick()))
  push(A.saveMember(sam, { id: alex, name: 'Alex', role: 'parent', colour: '#f72585', emoji: '👩', active: true }, tick()))
  push(A.saveMember(sam, { id: maya, name: 'Maya', role: 'child', colour: '#ffc857', emoji: '🦄', active: true, birthday: '2013-03-14' }, tick()))
  push(A.childProfile(maya, 'Maya', 8, tick()))
  push(
    A.saveMember(
      sam,
      {
        id: robin,
        name: 'Robin',
        role: 'baby',
        colour: '#b388ff',
        emoji: '👶',
        active: true,
        ...(babyMode === 'expecting' ? { dueDate: d(12) } : { birthday: babyMode === 'newborn' ? d(-3) : d(-70) }),
      },
      tick(),
    ),
  )
  push(A.saveMember(sam, { id: biscuit, name: 'Biscuit', role: 'pet', colour: '#ff9f68', emoji: '🐕', active: true, petKind: 'Dog', petPlan: { walksPerDay: 2, mealsPerDay: 2 } }, tick()))

  // ---- coins and the shop
  push(A.setEconomy(sam, { effectiveFrom: d(-14) }, tick()))
  for (const s of TREAT_SEEDS) push(A.saveTreat(sam, { ...s, forMembers: [], active: true }, tick()))

  // ---- school
  push(A.importSchoolPack(sam, maya, SAMPLE_PACK, tick()))
  push(A.addPackHomework(sam, emptyFamily(), maya, SAMPLE_PACK))
  // Homework set this week, dated from today so the demo always has something current: one planned, two not yet.
  const hwDemo = (key: string, subject: string, title: string, due: number, minutes: number, doOn?: number) =>
    push(
      A.saveTask(
        maya,
        { taskId: `demo-hw-${key}`, title, assignee: maya, kind: 'homework', part: 'any', subject, date: d(due), minutes, setOn: d(-1), doOn: doOn === undefined ? undefined : d(doOn) },
        tick(),
      ),
    )
  hwDemo('sci', 'Science', 'Cells worksheet', 3, 30, 0)
  hwDemo('maths', 'Maths', 'Sparx: fractions', 5, 40)
  hwDemo('hist', 'History', 'Norman castles paragraph', 1, 25)
  push(
    P.saveRoutine(
      maya,
      { title: 'Homework', emoji: '📚', ownerId: maya, steps: [], homework: true, startAt: '16:30', date: d(-7), recur: { freq: 'weekly', byWeekday: [0, 1, 2, 3, 4], schoolDaysOnly: true } },
      tick(),
    ),
  )

  // ---- calendar
  const cal = (title: string, o: Partial<Parameters<typeof A.saveCal>[1]> & { date: string }) =>
    push(A.saveCal(sam, { title, allDay: false, members: [], category: 'family', busy: true, ...o } as Parameters<typeof A.saveCal>[1], tick()))
  cal('Swimming lesson', {
    date: next(1),
    start: '16:30',
    end: '17:30',
    members: [maya],
    category: 'activity',
    recur: { freq: 'weekly', byWeekday: [1] },
    help: { note: 'Someone to drive and stay poolside' },
  })
  cal('Piano lesson', { date: next(2), start: '16:15', end: '17:00', members: [maya], category: 'activity', recur: { freq: 'weekly', byWeekday: [2] } })
  cal('Late meeting', { date: d(1), start: '17:00', end: '19:00', members: [sam], category: 'work', help: { note: 'Can someone do the school pick-up?' } })
  cal('Baby clinic', { date: next(3), start: '10:00', end: '10:45', members: [alex, robin], category: 'appointment', location: 'Health centre' })
  cal("Dinner at Grandma's", { date: next(5), start: '17:00', end: '20:00', everyone: true, category: 'family', location: 'Grandma and Grandad' })
  cal('Sam five-a-side', { date: next(4), start: '19:30', end: '20:30', members: [sam], category: 'activity', recur: { freq: 'weekly', byWeekday: [4] } })
  cal('Dentist', { date: d(2), start: '08:15', end: '09:00', members: [alex], category: 'appointment' })
  cal("Robin's 3 month jabs", { date: d(4), start: '11:00', end: '11:30', members: [alex, robin], category: 'appointment' })

  // ---- tasks
  const task = (title: string, o: Partial<Parameters<typeof A.saveTask>[1]> & { assignee: string }) =>
    push(A.saveTask(sam, { title, kind: 'chore', part: 'any', date: d(-14), ...o } as Parameters<typeof A.saveTask>[1], tick()))
  task('Pack school bag', { assignee: maya, kind: 'routine', part: 'evening', recur: { freq: 'daily', schoolDaysOnly: true }, check: 'self', coins: 2 })
  task('Empty the dishwasher', { assignee: maya, part: 'afternoon', minutes: 10, recur: { freq: 'weekly', byWeekday: [0, 2, 4] }, coins: 10 })
  task('Walk Biscuit', { assignee: maya, part: 'afternoon', minutes: 30, recur: { freq: 'daily' }, coins: 10, petLink: { petId: biscuit, kind: 'walk' } })
  task('Tidy bedroom', { assignee: maya, part: 'morning', minutes: 20, recur: { freq: 'weekly', byWeekday: [5] }, coins: 20 })
  task('Read for 20 minutes', { assignee: maya, kind: 'study', part: 'evening', minutes: 20, recur: { freq: 'daily' }, coins: 10, check: 'self' })
  task('Bins out', { assignee: sam, part: 'evening', recur: { freq: 'weekly', byWeekday: [3] }, coins: 0, check: 'self' })
  task('Feed Biscuit', { assignee: alex, part: 'morning', recur: { freq: 'daily' }, coins: 0, check: 'self', petLink: { petId: biscuit, kind: 'feed' } })

  // ---- family ideas and votes
  const idea = (title: string, kind: 'dinner' | 'outing' | 'movie' | 'game' | 'treat', emoji: string, by: string, votes: Record<string, 'yes' | 'maybe' | 'no'>) => {
    const id = `demo-idea-${title.toLowerCase().replace(/\W+/g, '-')}`
    push(A.proposeIdea(by, { ideaId: id, title, kind, emoji }, tick()))
    for (const [m, v] of Object.entries(votes)) push(A.castVote(m, id, v, tick()))
  }
  idea('Movie night', 'movie', '🍿', maya, { maya: 'yes', sam: 'yes', alex: 'maybe' })
  idea('Beach day', 'outing', '🏖️', sam, { sam: 'yes', maya: 'yes', alex: 'yes' })
  idea('Bowling', 'outing', '🎳', maya, { maya: 'yes', alex: 'no' })
  idea('Pizza night', 'dinner', '🍕', alex, { alex: 'yes', maya: 'yes' })
  idea('Board games', 'game', '🎲', sam, { sam: 'yes' })
  push([
    makeEvent(
      alex,
      { type: 'idea', ideaId: 'demo-idea-walk', title: 'Family walk with Biscuit', kind: 'outing', emoji: '🐕', status: 'planned', when: { date: next(6), start: '10:30', end: '12:30' } },
      tick(),
    ),
  ])

  // ---- baby and dog history (three days back)
  for (const back of babyMode ? [] : [2, 1, 0]) {
    const day = d(-back)
    for (const [i, hm] of ['06:10', '09:20', '12:30', '15:45', '18:50', '22:10'].entries()) {
      const at = ts(day, hm)
      if (at > now - 5 * MIN) continue
      push(
        A.logBaby(
          i % 2 ? alex : sam,
          { babyId: robin, kind: 'feed', at, feed: i === 5 ? { method: 'breast', side: 'L', minutes: 12 } : { method: 'bottle', ml: 90 + ((i + back) % 3) * 30, milk: 'formula' } },
          at + MIN,
        ),
      )
      const nat = at + 25 * MIN
      if (nat < now) push(A.logBaby(i % 2 ? alex : sam, { babyId: robin, kind: 'nappy', at: nat, nappy: { wet: true, dirty: i % 3 === 0 } }, nat))
    }
    for (const [a, b] of [
      ['10:00', '11:20'],
      ['13:30', '15:00'],
    ] as const) {
      if (ts(day, b) < now) push(A.logBaby(alex, { babyId: robin, kind: 'sleep', at: ts(day, a), endAt: ts(day, b) }, ts(day, b)))
    }
    for (const [hm, kind, mins] of [
      ['07:30', 'walk', 35],
      ['08:00', 'feed', 0],
      ['17:15', 'walk', 40],
      ['17:50', 'feed', 0],
    ] as const) {
      const at = ts(day, hm)
      if (at > now - 5 * MIN) continue
      push(
        A.logPet(
          kind === 'walk' ? maya : alex,
          emptyFamily(),
          { petId: biscuit, kind, at, minutes: mins || undefined, meal: kind === 'feed' ? (hm < '12:00' ? 'breakfast' : 'dinner') : undefined },
          at,
        ),
      )
    }
  }
  // This week's shifts: 4-hour blocks from 22:00, taken in turns, agreed at the weekly summit.
  if (!babyMode) {
    const rota = makeRota('22:00', 4, [alex, sam])
    push(A.saveShiftPlan(sam, { babyId: robin, weekOf: startOfWeek(today), ...legacyFieldsFor(rota), blocks: rota, confirmed: true }, tick()))
  }
  if (!babyMode) push(A.logBaby(alex, { babyId: robin, kind: 'growth', at: ts(d(-4), '09:00'), weightKg: 5.4 }, ts(d(-4), '09:00')))

  // ---- StudyQuest sessions for Maya on recent days (real questions, real points)
  await repo.setMe(maya)
  repo.apply(out.sort((a, b) => a.ts - b.ts))
  let clock = 0
  for (const [back, count] of [
    [6, 1],
    [5, 2],
    [3, 1],
    [2, 2],
    [1, 1],
    [0, 1],
  ] as const) {
    for (let k = 0; k < count; k++) {
      clock = ts(d(-back), k ? '19:30' : '16:40')
      if (clock > now - 10 * MIN) clock = now - 40 * MIN
      const s = new Session({
        registry: repo.registry,
        store: repo,
        learnerId: maya,
        subject: 'maths',
        gameId: 'tower',
        mode: 'practice',
        length: 8,
        seed: 100 + back * 10 + k,
        allowRetry: false,
        now: () => (clock += 6000),
      })
      let q
      while ((q = s.next())) s.submit(solutionFor(q.item))
      s.finish()
    }
  }

  // ---- what happened this week: some done and checked, some waiting
  const fam = () => repo.family()
  const hw = Object.values(fam().tasks).filter((x) => x.kind === 'homework')
  const first = hw[0]
  const late: AppEvent[] = []
  if (first) late.push(...A.completeTask(maya, fam(), first, first.date ?? 'any', { minutes: 35 }, now - 3 * HOUR))
  const dish = Object.values(fam().tasks).find((x) => x.title === 'Empty the dishwasher')
  if (dish) {
    const dd = d(-2)
    late.push(...A.completeTask(maya, fam(), dish, dd, { minutes: 8 }, ts(dd, '17:00')))
  }
  repo.apply(late)
  const doneYesterday = Object.values(fam().done).find((x) => x.status === 'pending' && x.date === d(-2))
  if (doneYesterday) repo.apply(A.checkTask(sam, doneYesterday.taskId, doneYesterday.date, 'approved', undefined, ts(d(-2), '18:30')))
  repo.apply(A.adjustCoins(alex, maya, 15, 'Helped with the shopping', ts(d(-3), '12:00')))
  const treat = Object.values(fam().treats).find((x) => x.cost <= 60)
  if (treat) {
    const { events, redeemId } = A.redeemTreat(maya, maya, treat, now - 2 * HOUR)
    repo.apply(events)
    void redeemId
  }
  // A focus timer that is running right now.
  const pack = Object.values(fam().tasks).find((x) => x.kind === 'homework' && !fam().done[`${x.taskId}|${x.date}`])
  if (pack) repo.apply(A.startTimer(maya, { memberId: maya, label: pack.title, plannedSec: 25 * 60, taskId: pack.taskId, taskDate: pack.date ?? 'any', purpose: 'focus' }, now - 8 * MIN).events)

  // ---- sessions, brain dump, meals and shopping
  const tpl = (id: string) => SESSION_TEMPLATES.find((x) => x.id === id) ?? SESSION_TEMPLATES[0]!
  {
    const t0 = tpl('morning')
    const routineId = 'demo-morning'
    const taskId = `sess-${routineId}`
    const steps = t0.steps.map((s, i) => ({ id: `demo-m${i}`, title: s.title, minutes: s.minutes, emoji: s.emoji, ...(s.habitsSlot ? { habitsSlot: s.habitsSlot } : {}) }))
    repo.apply(
      A.saveTask(
        sam,
        {
          taskId,
          title: t0.title,
          assignee: maya,
          kind: 'routine',
          part: 'morning',
          date: d(-14),
          minutes: steps.reduce((n, s) => n + s.minutes, 0),
          coins: 5,
          check: 'self',
          recur: { freq: 'daily', schoolDaysOnly: true },
        },
        now - 15 * 24 * HOUR,
      ),
    )
    repo.apply(
      P.saveRoutine(
        sam,
        { routineId, title: t0.title, emoji: t0.emoji, ownerId: maya, steps, finishBy: '08:15', startAt: '07:30', date: d(-14), recur: { freq: 'daily', schoolDaysOnly: true }, taskId },
        now - 15 * 24 * HOUR,
      ),
    )
    // Two mornings already done, so "your usual times" has something to say.
    for (const [back, took] of [
      [3, [6, 17, 5, 7]],
      [2, [5, 14, 4, 6]],
    ] as const) {
      const day = d(-back)
      if (weekday(day) > 4) continue
      let at = ts(day, '07:32')
      const started = P.startRun(maya, maya, { routine: fam().routines[routineId]! }, at)
      repo.apply(started.events)
      for (const [i, st] of steps.entries()) {
        at += (took[i] ?? st.minutes) * MIN
        repo.apply(P.finishStep(maya, fam(), started.runId, st.id, 'done', at))
      }
    }
    const t1 = tpl('admin')
    repo.apply(
      P.saveRoutine(
        alex,
        {
          routineId: 'demo-admin',
          title: t1.title,
          emoji: t1.emoji,
          ownerId: alex,
          steps: t1.steps.map((s, i) => ({ id: `demo-a${i}`, title: s.title, minutes: s.minutes, emoji: s.emoji })),
          finishBy: t1.finishBy,
        },
        now - 5 * 24 * HOUR,
      ),
    )
    const t2 = tpl('tidy')
    repo.apply(
      P.saveRoutine(
        sam,
        {
          routineId: 'demo-tidy',
          title: t2.title,
          emoji: t2.emoji,
          ownerId: sam,
          steps: t2.steps.map((s, i) => ({ id: `demo-t${i}`, title: s.title, minutes: s.minutes, emoji: s.emoji })),
          startAt: '10:00',
          date: next(6),
        },
        now - 4 * 24 * HOUR,
      ),
    )
  }
  // ---- routine plans (fictional): Maya's school-day and weekend routines with a before-you-leave list, and Sam's
  for (const [who, role] of [
    [maya, 'child'],
    [sam, 'parent'],
  ] as const) {
    const base = planDefaults(role)
    const schoolDays = hasOwnSchool(makeCalCtx(fam()), who)
    repo.apply(
      applyRoutinePlan(sam, fam(), { memberId: who, ...base, habitKeys: [...base.habitKeys, ...(role === 'child' ? ['wash-face'] : ['moisturise', 'meditate'])], schoolDays }, now - 6 * 24 * HOUR),
    )
  }
  repo.apply(
    P.addDump(
      alex,
      parseDump(
        [
          'Home:',
          '- Fix the dripping bathroom tap ~30 @sam',
          '- Clear out the loft ~1h30 #someday',
          '- Put up the baby shelf ~20 @sam !',
          'Admin:',
          '- Renew car insurance ~15 !',
          '- Book the boiler service ~10',
          '- Register Robin with the dentist ~15 @alex',
          'Errands:',
          '- Post the parcel back to the shop ~10',
          '- Get a birthday card for Grandma ~15',
          'Baby:',
          '- Wash and fold the newborn clothes ~30',
          '- Pack the hospital bag ~30 !',
        ].join('\n'),
        [
          { id: sam, name: 'Sam' },
          { id: alex, name: 'Alex' },
        ],
      ),
      now - 3 * 24 * HOUR,
    ),
  )
  {
    const items = Object.values(fam().dump).filter((x) => !x.deleted)
    const by = (needle: string) => items.find((x) => x.title.includes(needle))
    const card = by('birthday card')
    if (card) repo.apply(P.scheduleDump(alex, fam(), card, { date: d(2), assignee: alex }, now - 2 * 24 * HOUR))
    const ins = by('car insurance')
    const boiler = by('boiler')
    const bag = by('hospital bag')
    if (ins && boiler) repo.apply(P.addDumpToRoutine(alex, fam().routines['demo-admin']!, [ins, boiler], now - 2 * 24 * HOUR))
    void bag
    const parcel = by('Post the parcel')
    if (parcel) repo.apply(P.saveDump(alex, parcel, { status: 'done' }, now - 24 * HOUR))
  }

  // Projects: a family one (broken down two levels, partly done, with sessions planned) and one of Maya's.
  {
    const at = now - 6 * 24 * HOUR
    const tk = (id: string, title: string, description: string, estimated_minutes: number, dependencies: string[] = []) => ({ task_id: id, title, description, estimated_minutes, dependencies })
    const study = PA.saveProject(
      alex,
      {
        title: 'Box room into a study',
        goal: 'Turn the box room into a quiet study for Maya before half term',
        emoji: '🛠️',
        context: 'Budget about £250. Keep the old desk. Maya wants to choose the colour.',
        grain: 30,
        dailyMinutes: 60,
        skill: 'some',
        created: at,
      },
      at,
    )
    repo.apply(study.events)
    const top = PA.applyBreakdown(
      alex,
      fam(),
      study.projectId,
      undefined,
      {
        project_title: 'Box room into a study',
        total_estimated_minutes: 0,
        tasks: [
          tk('t1', 'Clear out the box room', 'Everything out: keep, charity or tip.', 120),
          tk('t2', 'Choose the colour and furniture with Maya', 'Agree a colour, a chair and storage within budget.', 45),
          tk('t3', 'Decorate', 'Prepare and paint the walls and woodwork.', 360, ['t1', 't2']),
          tk('t4', 'Furnish and set up', 'Build the furniture and set up the desk.', 180, ['t3']),
          tk('t5', 'Make it Maya’s', 'Pin-board, lamp, books: let her finish it off.', 45, ['t4']),
        ],
      },
      at + 1000,
    )
    repo.apply(top.events)
    const [clear, choose, decorate, furnish] = top.ids
    const inside = (id: string | undefined, tasks: ReturnType<typeof tk>[], t: number) => {
      if (!id) return []
      const r = PA.applyBreakdown(alex, fam(), study.projectId, id, { project_title: '', total_estimated_minutes: 0, tasks }, t)
      repo.apply(r.events)
      return r.ids
    }
    const clearIds = inside(
      clear,
      [
        tk('a', 'Sort everything into keep, charity and tip', 'Three piles on the landing.', 60),
        tk('b', 'Take the charity bags to the shop', 'Drop them at the British Heart Foundation shop.', 30, ['a']),
        tk('c', 'Book the tip run', 'Book a slot online and load the car.', 30, ['a']),
      ],
      at + 2000,
    )
    inside(
      decorate,
      [
        tk('a', 'Fill cracks and sand', 'Filler in the cracks, sand smooth when dry.', 60),
        tk('b', 'Wash down and mask up', 'Sugar soap the walls; tape the skirting and window.', 45, ['a']),
        tk('c', 'First coat on the walls', 'Cut in first, then roll.', 90, ['b']),
        tk('d', 'Second coat on the walls', 'At least four hours after the first.', 90, ['c']),
        tk('e', 'Paint the skirting and door', 'Satin white, two thin coats.', 75, ['c']),
      ],
      at + 3000,
    )
    inside(
      furnish,
      [
        tk('a', 'Build the bookcase', 'Flat-pack: check every part is there first.', 60),
        tk('b', 'Fit the shelf above the desk', 'Find the studs, level, drill, fix.', 45),
        tk('c', 'Move the desk in and sort the cables', 'Tidy the cables behind the desk.', 45, ['a']),
      ],
      at + 4000,
    )
    // Most of the clearing out is done, and the choosing; the rest is to come.
    for (const id of [...clearIds.slice(0, 2), choose]) {
      const a = id ? fam().activities[id] : undefined
      if (a) repo.apply(PA.tickActivity(id === choose ? maya : sam, fam(), a, true, at + 2 * 24 * HOUR))
    }
    const t = projectTree(fam(), study.projectId)
    if (t) repo.apply(PA.planSessions(alex, fam(), t, { minutes: 90, days: [5, 6], from: today, startAt: '10:00', ownerId: sam }, now - 2 * HOUR).events)

    const fair = PA.saveProject(
      maya,
      {
        title: 'Science fair project',
        goal: 'Find out whether music helps cress grow faster, for the Year 8 science fair',
        emoji: '🌱',
        ownerId: maya,
        grain: 20,
        dailyMinutes: 30,
        skill: 'new',
        created: at + 10_000,
      },
      at + 10_000,
    )
    repo.apply(fair.events)
    repo.apply(
      PA.applyBreakdown(
        maya,
        fam(),
        fair.projectId,
        undefined,
        {
          project_title: 'Science fair project',
          total_estimated_minutes: 0,
          tasks: [
            tk('t1', 'Write the question and a prediction', 'One sentence each, in your science book.', 15),
            tk('t2', 'Plan a fair test', 'Same seeds, soil, water and light; only the music changes.', 20, ['t1']),
            tk('t3', 'Set up two trays of cress', 'Ask a grown-up for a spare room for the music tray.', 20, ['t2']),
            tk('t4', 'Measure and record every day for a week', 'Height of five shoots per tray, in a table.', 70, ['t3']),
            tk('t5', 'Draw a graph of the results', 'Line graph: day against average height.', 20, ['t4']),
            tk('t6', 'Make the poster', 'Question, method, graph, conclusion.', 40, ['t5']),
          ],
        },
        at + 11_000,
      ).events,
    )
  }

  // Meals: the starter recipes, dinners for the week, and a shopping list built from them.
  repo.apply(P.seedRecipes(sam, fam(), STARTER_RECIPES))
  {
    const rec = (id: string) => fam().recipes[`starter-${id}`]
    const dinners: Array<[number, string]> = [
      [-2, 'fajitas'],
      [-1, 'sausage-mash'],
      [0, 'spag-bol'],
      [1, 'fish-fingers'],
      [2, 'curry'],
      [3, 'jacket'],
      [4, 'pizza'],
    ]
    for (const [n, id] of dinners) {
      const r = rec(id)
      if (r) repo.apply(P.planMeal(alex, { date: d(n), slot: 'dinner', recipe: r, cookId: n % 2 ? sam : alex }, now - 5 * 24 * HOUR))
    }
    const r = rec('porridge')
    if (r) repo.apply(P.planMeal(alex, { date: d(1), slot: 'breakfast', recipe: r }, now - 5 * 24 * HOUR))
    // Past shops so the "usuals" chips have something to suggest.
    for (const [back, text] of [
      [13, 'milk\nbread\nbananas\ncheddar\neggs'],
      [6, 'milk\nbread\nbananas\ndog food\nnappies'],
      [1, 'milk\nbread\neggs\nnappies'],
    ] as const) {
      const at = now - back * 24 * HOUR
      repo.apply(P.addTextToList(alex, fam(), 'list-main', text, at))
      repo.apply(
        P.clearTicked(
          alex,
          Object.values(fam().shopItems).filter((i) => !i.deleted),
          at,
        ),
      )
      repo.apply(
        Object.values(fam().shopItems)
          .filter((i) => !i.done && !i.deleted)
          .flatMap((i) => P.tickItem(alex, i, true, at + 30 * MIN)),
      )
    }
    const { events } = P.addPlanToList(alex, fam(), 'list-main', d(0), d(4), now - HOUR)
    repo.apply(events)
    repo.apply(P.addTextToList(alex, fam(), 'list-main', 'milk\n2 pints semi-skimmed\nbin bags', now - HOUR / 2))
  }

  // ---- Tier 1 Care/Dog demo data: feed sessions, medicine, milk stock, dog treatment/output/stock
  if (!babyMode) {
    repo.apply(CA.seedMedRules(sam, fam(), now - 3 * 24 * HOUR))
    // A dose logged recently, so the medicine lock has something to show.
    repo.apply(CA.logMedicine(alex, robin, 'Vitamin D drops', {}, ts(d(0), '08:00')))
    // Expressed milk in the freezer, some already used by a bottle feed.
    repo.apply(CA.addMilk(alex, robin, 120, { expressedDate: d(-2) }, ts(d(-2), '20:00')))
    repo.apply(CA.addMilk(alex, robin, 90, { expressedDate: d(-1) }, ts(d(-1), '20:00')))
    repo.apply(CA.deductMilk(sam, fam(), robin, 90, 'demo-feed', ts(d(0), '02:00')))
  }
  // Dog: today's breakfast already fed (so the anti-double-feed lock has something to show), a treatment due soon,
  // an upset-tummy entry for the vet history, and a bag of food nearly out.
  repo.apply(A.logPet(alex, fam(), { petId: biscuit, kind: 'feed', at: ts(d(0), '07:15'), meal: 'breakfast' }, ts(d(0), '07:15')))
  repo.apply(CA.logTreatment(sam, fam(), biscuit, 'Nexgard', 28, ts(d(-26), '09:00')))
  repo.apply(CA.logOutput(alex, fam(), biscuit, 'diarrhoea', { firmness: 4 }, ts(d(-1), '18:30')))
  repo.apply(CA.openStock(sam, { petId: biscuit, product: 'Chunky kibble 12kg', weightG: 12000, dailyG: 500, openedDate: d(-18) }, ts(d(-18), '09:00')))
  // A reference vault with a couple of everyday entries.
  repo.apply(CA.saveVaultItem(sam, { memberId: robin, label: 'NHS number', value: '999 000 0000 (example)', category: 'Health' }, now - 24 * HOUR))
  repo.apply(CA.saveVaultItem(sam, { memberId: biscuit, label: 'Microchip number', value: '000 000 000 000 000 (example)', category: 'Pets' }, now - 24 * HOUR))
  repo.apply(CA.saveVaultItem(sam, { label: 'Boiler service due', value: d(45), category: 'Home' }, now - 24 * HOUR))
  // Plants: a few watered recently, a couple overdue (so "Start watering" has something to do), one never watered.
  for (const [name, emoji, room, back] of [
    ['Monstera', '🪴', 'Living room', 2],
    ['Peace lily', '🌸', 'Living room', 9],
    ['Basil', '🌿', 'Kitchen windowsill', 3],
    ['Spider plant', '🌱', 'Landing', 12],
    ['Aloe vera', '🌵', 'Bathroom', 5],
    ['Fern', '🌿', 'Bathroom', undefined],
  ] as const) {
    const who = back !== undefined && back % 2 ? alex : sam
    repo.apply(PL.savePlant(who, { name, emoji, room }, ts(d(-20), '10:00'), back === undefined ? undefined : ts(d(-back), '09:30')).events)
  }

  // Travel and alarms: a pretend home server with a school run, a plan for today and an alarm (fictional stations).
  {
    const at = now - 2 * 24 * HOUR
    const srv = (body: Record<string, unknown>, when: number) => makeEvent(sam, body as never, when)
    repo.apply([
      srv(
        {
          type: 'server-features',
          alarms: true,
          trains: true,
          car: false,
          speakers: [
            { id: 'media_player.kitchen', name: 'Kitchen' },
            { id: 'media_player.landing', name: 'Landing' },
          ],
          linked: [sam, maya],
          version: '0.10.0',
        },
        at,
      ),
    ])
    // Two suggestions from the assistant, waiting for someone to tap Add (no assistant address in the demo, so no chat).
    repo.apply([
      srv({ type: 'proposal', proposalId: 'demo-pr1', kind: 'event', summary: 'Add \'Swimming\' for Maya on Sat 10:15-11:00', reason: 'Saturday morning is free after breakfast.', forMembers: [maya], from: 'assistant' }, now - HOUR),
      srv({ type: 'proposal', proposalId: 'demo-pr2', kind: 'task', summary: 'Add homework \'Maths sheet\' for Maya, due Thu, about 40 min', reason: 'Her last three maths sheets took about 40 minutes.', forMembers: [maya], from: 'assistant' }, now - 30 * 60_000),
    ])
    // The home server's plan for today, and one "on track?" question waiting for an answer.
    const hhmm = (t: number) => new Date(t).toTimeString().slice(0, 5)
    repo.apply([
      srv(
        {
          type: 'day-plan',
          memberId: sam,
          date: today,
          spareMin: 185,
          warnings: [],
          blocks: [
            { start: '07:00', end: '07:30', kind: 'walk', title: 'Walk Biscuit' },
            { start: '09:00', end: '12:00', kind: 'event', title: 'Work' },
            { start: '13:00', end: '17:00', kind: 'event', title: 'Work' },
            { start: '17:15', end: '18:00', kind: 'cook', title: 'Cook dinner (Pasta bake)', guess: true },
            { start: '18:00', end: '19:00', kind: 'meal', title: 'Dinner' },
            { start: '19:00', end: '20:30', kind: 'free', title: 'Free time' },
          ],
        },
        now - 5 * HOUR,
      ),
      srv(
        {
          type: 'day-plan',
          memberId: maya,
          date: today,
          spareMin: 140,
          warnings: ['only 5 min between Chess club and the walk home'],
          blocks: [
            { start: '08:40', end: '15:05', kind: 'school', title: 'School' },
            { start: '15:10', end: '16:00', kind: 'club', title: 'Chess club' },
            { start: '16:15', end: '16:55', kind: 'homework', title: 'Maths sheet' },
            { start: '17:00', end: '19:30', kind: 'free', title: 'Free time' },
          ],
        },
        now - 5 * HOUR,
      ),
      srv({ type: 'nudge', nudgeId: 'demo-ng1', memberId: sam, date: today, kind: 'cook', title: 'Cook dinner (Pasta bake)', start: hhmm(now - 5 * 60_000), end: hhmm(now + 40 * 60_000), minutes: 45, n: 1 }, now - 5 * 60_000),
    ])
    // This week's round table, already put together by the assistant, with one thing Maya raised.
    const rtWeek = addDays(startOfWeek(today), 7)
    repo.apply(TR.addRoundTableNote(maya, rtWeek, 'Can we go swimming on Saturday?', now - 20 * HOUR))
    repo.apply([
      srv({ type: 'proposal', proposalId: 'demo-pr3', kind: 'change', summary: 'Change \'Cook dinner\' on Tue: Alex instead of Sam', reason: 'Sam has a late meeting on Tuesday.', forMembers: [sam], from: 'assistant' }, now - 2 * HOUR),
      srv(
        {
          type: 'round-table',
          weekOf: rtWeek,
          status: 'ready',
          source: 'assistant',
          facts: {
            weekOf: rtWeek,
            days: [0, 1, 2, 3, 4, 5, 6].map((i) => {
              const date = addDays(rtWeek, i)
              const label = new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')
              return {
                date,
                label,
                people: [
                  { name: 'Sam', fixed: i < 5 ? ['Work 09:00'] : [], mustdo: 60, free: i < 5 ? 90 : 300, school: false },
                  { name: 'Maya', fixed: i === 1 ? ['Chess club 15:10'] : i === 5 ? ['Swimming 10:15'] : [], mustdo: i < 5 ? 40 : 15, free: i < 5 ? 120 : 360, school: i < 5 },
                ],
                warnings: i === 1 ? ['Sam: Work (17:00-18:30) overlaps Cook dinner'] : [],
              }
            }),
            issues: ['Tue: Sam: Work (17:00-18:30) overlaps Cook dinner'],
            learned: ['Maya: Maths sheet usually takes about 40 min, not 20'],
            review: { from: addDays(rtWeek, -7), to: addDays(rtWeek, -1), people: [
              { name: 'Maya', asked: 6, ok: 4, done: 1, later: 1, late: 0, skip: 0, swap: 0, none: 0, tasksDone: 9 },
              { name: 'Sam', asked: 5, ok: 3, done: 0, later: 0, late: 1, skip: 0, swap: 1, none: 0, tasksDone: 6 },
            ] },
          },
          agenda: {
            summary: 'A good week ahead! One clash on Tuesday, and Maya’s swimming fits nicely on Saturday morning.',
            points: [
              { text: 'Tuesday: Sam works late, so Alex could cook dinner (suggested below).' },
              { text: 'Maya asked about swimming on Saturday: 10:15 is free for everyone.' },
              { text: 'Maths sheets take Maya about 40 minutes, so they are planned that long now.' },
              { text: 'Last week went well: 5 of 6 “on track?” answers from Maya were yes.' },
            ],
            proposals: ['demo-pr3', 'demo-pr1'],
          },
        },
        now - 90 * 60_000,
      ),
    ])
    repo.apply(TR.savePlace(sam, { placeId: 'demo-home', name: 'Home', kind: 'home', station: 'BTN', stationName: 'Brighton', walkMin: 8 }, at))
    repo.apply(TR.savePlace(sam, { placeId: 'demo-school', name: 'School', kind: 'school', station: 'HHE', stationName: 'Haywards Heath', walkMin: 25 }, at))
    repo.apply(TR.savePlace(sam, { placeId: 'demo-gran', name: 'Gran’s', kind: 'other', station: 'LWS', stationName: 'Lewes', walkMin: 10 }, at))
    repo.apply(TR.savePrefs(sam, { memberId: maya, leadMin: 12, mode: 'train' }, at))
    repo.apply(
      TR.saveTrip(
        sam,
        {
          tripId: 'demo-run',
          title: 'School run',
          members: [maya],
          date: d(-weekday(today)),
          recur: { freq: 'weekly', byWeekday: [0, 1, 2, 3, 4] },
          spec: { placeId: 'demo-school', mode: 'train', arriveBy: '08:30' },
          leaveAt: '15:05',
        },
        at,
      ),
    )
    repo.apply(
      TR.saveAlarm(
        sam,
        {
          alarmId: 'demo-wake',
          memberId: maya,
          title: 'Time to get up, Maya',
          date: d(-weekday(today)),
          time: '06:50',
          recur: { freq: 'weekly', byWeekday: [0, 1, 2, 3, 4] },
          speakers: ['media_player.landing'],
          stopWhenLeave: true,
        },
        at,
      ),
    )
    repo.apply(
      A.saveCal(
        alex,
        {
          calId: 'demo-gran-visit',
          title: 'Lunch at Gran’s',
          date: next(5),
          allDay: false,
          start: '12:30',
          end: '15:00',
          members: [alex, maya],
          category: 'family',
          busy: true,
          trip: { placeId: 'demo-gran', mode: 'train', via: [{ station: 'HHE', stationName: 'Haywards Heath', changeMin: 5 }] },
        },
        at,
      ),
    )
    const legs = [
      {
        key: 'out',
        refId: 'demo-run',
        direction: 'out',
        fromName: 'Home',
        toName: 'School',
        mode: 'train',
        leaveBy: '07:30',
        arrive: '08:24',
        status: 'disrupted',
        note: 'the 07:52 is cancelled',
        hops: [{ from: 'Brighton', to: 'Haywards Heath', dep: '07:42', arr: '07:59', platform: '4', late: 2 }],
      },
      {
        key: 'back',
        refId: 'demo-run',
        direction: 'back',
        fromName: 'School',
        toName: 'Home',
        mode: 'train',
        leaveBy: '15:05',
        arrive: '16:02',
        status: 'planned',
        hops: [{ from: 'Haywards Heath', to: 'Brighton', dep: '15:38', arr: '15:54', platform: '2' }],
      },
    ]
    if (weekday(today) < 5) {
      repo.apply([srv({ type: 'travel-day', memberId: maya, date: today, legs }, now - 30 * MIN)])
      repo.apply([srv({ type: 'sched-status', refId: 'demo-run', date: today, memberId: maya, state: 'scheduled' }, now - 30 * MIN)])
    }
  }

  await repo.setMe(asChild ? maya : sam)
}
