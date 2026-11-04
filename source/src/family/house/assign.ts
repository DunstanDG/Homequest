/**
 * Suggesting who does what. The default is per room: each room goes to one person (a child's own room to that child), so
 * people are not tripping over each other and "I'm doing the kitchen" is easy to say. Jobs a person is too young for move to
 * the least busy person who is old enough. Everything here is only a suggestion: whoever starts the session confirms it and
 * can give any single job to anyone (see the setup screen).
 */
import type { FamilyState, HouseRunJob, Member, MemberId, Ymd } from '../types'

/** Age in whole years on `date`. Without a birthday: adults count as 40, children as 10. */
export function ageOf(m: Pick<Member, 'birthday' | 'role'>, date: Ymd): number {
  if (m.birthday) {
    const y = Number(date.slice(0, 4)) - Number(m.birthday.slice(0, 4))
    const before = date.slice(5) < m.birthday.slice(5)
    return Math.max(0, y - (before ? 1 : 0))
  }
  return m.role === 'parent' ? 40 : 10
}

/** How much of a grown-up's pace someone keeps up: small children do less in the same time. */
const capacity = (age: number): number => (age >= 14 ? 1 : age >= 10 ? 0.8 : age >= 7 ? 0.6 : 0.4)

export interface AssignRoom {
  roomId: string
  ownerId?: MemberId
  jobs: Pick<HouseRunJob, 'jobId' | 'minutes' | 'minAge'>[]
}

/**
 * Give every job to someone. Returns jobId -> person. `people` are the ones taking part; `locked` keeps choices already made
 * (a job someone was handed by hand stays with them).
 */
export function autoAssign(f: FamilyState, people: readonly MemberId[], rooms: readonly AssignRoom[], date: Ymd, locked: Record<string, MemberId> = {}): Record<string, MemberId> {
  const folk = people.map((id) => f.members[id]).filter((m): m is Member => !!m && (m.role === 'parent' || m.role === 'child'))
  const out: Record<string, MemberId> = {}
  if (!folk.length) return out
  const age = new Map(folk.map((m) => [m.id, ageOf(m, date)]))
  const load = new Map(folk.map((m) => [m.id, 0]))
  const pace = (id: MemberId) => capacity(age.get(id) ?? 10)
  const add = (id: MemberId, min: number) => load.set(id, (load.get(id) ?? 0) + min / pace(id))
  const leastBusy = (ok: (m: Member) => boolean): Member | undefined => folk.filter(ok).sort((a, b) => load.get(a.id)! - load.get(b.id)! || a.name.localeCompare(b.name))[0]

  // Jobs already placed by hand count towards people's load first.
  for (const r of rooms) for (const j of r.jobs) if (locked[j.jobId] && load.has(locked[j.jobId]!)) ((out[j.jobId] = locked[j.jobId]!), add(locked[j.jobId]!, j.minutes))

  // Biggest rooms first, so the heaviest work is spread before the small rooms fill the gaps.
  const left = rooms.map((r) => ({ r, todo: r.jobs.filter((j) => !out[j.jobId]) })).filter((x) => x.todo.length)
  left.sort((a, b) => b.todo.reduce((t, j) => t + j.minutes, 0) - a.todo.reduce((t, j) => t + j.minutes, 0))
  for (const { r, todo } of left) {
    const owner = r.ownerId && load.has(r.ownerId) ? f.members[r.ownerId] : undefined
    // A room's person is the least busy who could do most of it; a child's own room is theirs.
    const room = owner ?? leastBusy((m) => todo.filter((j) => age.get(m.id)! >= j.minAge).length >= todo.length / 2) ?? leastBusy(() => true)!
    add(room.id, 0)
    for (const j of todo) {
      const ok = age.get(room.id)! >= j.minAge
      const who = ok ? room : (leastBusy((m) => age.get(m.id)! >= j.minAge) ?? leastBusy((m) => m.role === 'parent') ?? room)
      out[j.jobId] = who.id
      add(who.id, j.minutes)
    }
  }
  return out
}

/** Give a whole room to one person: every job in it that they are old enough for (the rest stay as they were). */
export function roomTo(jobs: readonly Pick<HouseRunJob, 'jobId' | 'minAge'>[], current: Record<string, MemberId | undefined>, to: MemberId, toAge: number): Record<string, MemberId | undefined> {
  const next = { ...current }
  for (const j of jobs) if (toAge >= j.minAge || !next[j.jobId]) next[j.jobId] = to
  return next
}

/** Who is carrying how many minutes, from a job -> person map. */
export function loadOf(jobs: readonly Pick<HouseRunJob, 'jobId' | 'minutes'>[], who: Record<string, MemberId | undefined>): Record<MemberId, number> {
  const out: Record<MemberId, number> = {}
  for (const j of jobs) {
    const w = who[j.jobId]
    if (w) out[w] = (out[w] ?? 0) + j.minutes
  }
  return out
}
