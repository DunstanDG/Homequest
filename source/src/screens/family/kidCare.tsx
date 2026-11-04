/**
 * A child's care jobs on Today: the dog's meals, water and walks and the plants that need a water, as one-tap
 * buttons, scoped to what this child looks after (People › edit child › Looks after). Logging here is the same as
 * logging in Care, so it also ticks any linked chore ("Feed Biscuit") and earns its coins.
 */
import { Link } from 'react-router-dom'
import * as A from '@/family/actions'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { bornBabies } from '@/family/arrival/arrival'
import { lastBaby, looksAfterOf, petDay, petPlan, suggestMeal } from '@/family/care'
import { ago, hmOf, ymdOf } from '@/family/dates'
import { mealLock } from '@/family/dog'
import { duePlants, livePlants } from '@/family/plants'
import { activeTimers } from '@/family/timers'
import type { Member } from '@/family/types'
import { Avatar, SectionHead } from '@/ui/fam'

export function KidCareCard({ child }: { child: Member }) {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const now = useNow(30_000)
  const today = ymdOf(now)
  const duties = looksAfterOf(child)
  const pets = duties.has('pets') ? Object.values(f.members).filter((m) => m.active && m.role === 'pet') : []
  const babies = duties.has('baby') ? bornBabies(f) : []
  const plants = duties.has('plants') ? livePlants(f) : []
  const thirsty = duties.has('plants') ? duePlants(f, now) : []
  if (!pets.length && !babies.length && !plants.length) return null

  const logPet = (pet: Member, draft: Omit<Parameters<typeof A.logPet>[2], 'petId' | 'at'>, msg: string) => {
    const evs = A.logPet(me.id, f, { petId: pet.id, at: Date.now(), ...draft })
    act(evs)
    toast(msg, { undo: () => act(evs.flatMap((e) => A.undo(me.id, e.id))) })
  }

  return (
    <>
      <SectionHead
        title="Looking after"
        action={
          <Link to="/care" className="link-btn">
            Care
          </Link>
        }
      />
      <div className="card kid-care">
        {pets.map((p) => {
          const d = petDay(f, p.id, today)
          const plan = petPlan(f, p.id)
          const lock = mealLock(f, p.id, 'breakfast', now)
          const walking = activeTimers(f, { subjectId: p.id }).some((t) => t.purpose === 'walk')
          const meal = suggestMeal(now)
          return (
            <div key={p.id} className="kc-row">
              <Avatar m={p} size={36} />
              <div className="grow">
                <strong>{p.name}</strong>
                <small className="muted" style={{ display: 'block' }}>
                  Meals {d.meals.length}/{plan.mealsPerDay} · Walks {d.walks.length}/{plan.walksPerDay}
                  {lock.locked ? ` · fed by ${lock.by === me.id ? 'you' : (f.members[lock.by!]?.name ?? 'someone')} at ${hmOf(lock.at!)}` : ''}
                </small>
                <div className="kc-acts">
                  <button type="button" className="btn small primary" disabled={lock.locked} onClick={() => logPet(p, { kind: 'feed', meal }, `${p.name}'s ${meal} logged. Thank you!`)}>
                    🍖 {lock.locked ? 'Fed' : `Feed ${meal}`}
                  </button>
                  <button type="button" className="btn small" onClick={() => logPet(p, { kind: 'water' }, 'Fresh water logged.')}>
                    💧 Water
                  </button>
                  <button
                    type="button"
                    className="btn small"
                    disabled={walking}
                    onClick={() => {
                      act(A.startTimer(me.id, { memberId: me.id, label: `Walking ${p.name}`, purpose: 'walk', subjectId: p.id }).events)
                      toast(`Walk started. Stop the timer when you're back.`)
                    }}
                  >
                    🦮 {walking ? 'Walking…' : 'Start walk'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {plants.length > 0 && (
          <div className="kc-row">
            <span className="glance-emoji" aria-hidden="true">
              🪴
            </span>
            <div className="grow">
              <strong>Plants</strong>
              <small className="muted" style={{ display: 'block' }}>
                {thirsty.length
                  ? `${thirsty.length} need a water: ${thirsty
                      .slice(0, 3)
                      .map((s) => s.plant.name)
                      .join(', ')}${thirsty.length > 3 ? '…' : ''}`
                  : 'All watered. Nice.'}
              </small>
              {thirsty.length > 0 && (
                <div className="kc-acts">
                  <Link to="/care?s=plants" className="btn small primary">
                    Water them
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        {babies.map((b) => {
          const lf = lastBaby(f, b.id, 'feed')
          return (
            <Link key={b.id} to={`/care?s=${b.id}`} className="kc-row" style={{ color: 'inherit', textDecoration: 'none' }}>
              <Avatar m={b} size={36} />
              <div className="grow">
                <strong>{b.name}</strong>
                <small className="muted" style={{ display: 'block' }}>
                  {lf ? `Fed ${ago(lf.at, now)}` : 'No feeds logged yet'} · tap to help
                </small>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
