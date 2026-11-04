import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { createPlan } from '@/family/planThing'
import { addDays, fmtDuration, friendlyDay, ymdOf } from '@/family/dates'
import { TEMPLATES, generateSteps, previewLine, templateById, type PlanTemplate, type Who } from '@/family/templates'
import type { Ymd } from '@/family/types'
import { ScreenHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { usePeople } from '@/screens/family/shared'

const WHO: Record<Who, string> = { parent: 'A parent', child: 'A child', anyone: 'Anyone' }

/**
 * "Plan a thing": pick a kind of event, give it a date, keep the steps you want, and each step turns up on the right
 * person's Today on its day. The whole plan lives in Plan > Projects. Nothing is pushed: steps just wait their turn.
 */
export function PlanAThing() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const people = usePeople()
  const today = ymdOf(useNow(60_000))
  const kids = people.filter((m) => m.role === 'child')

  const first = params.get('template') ? templateById(params.get('template')!) : undefined
  const [tpl, setTpl] = useState<PlanTemplate | undefined>(first)
  const [name, setName] = useState(first?.defaultName ?? '')
  const [date, setDate] = useState<Ymd>(addDays(today, 21))
  const [off, setOff] = useState<Set<string>>(new Set())
  const [on, setOn] = useState<Set<string>>(new Set())
  const [child, setChild] = useState(kids[0]?.id)
  const [custom, setCustom] = useState<string[]>([])
  const [extra, setExtra] = useState('')

  const pick = (t: PlanTemplate) => {
    setTpl(t)
    setName(t.defaultName)
    setOff(new Set())
    setOn(new Set())
    setCustom([])
  }

  const chosen = useMemo(() => {
    if (!tpl) return []
    const base = tpl.steps.filter((s) => (s.optional ? on.has(s.id) : !off.has(s.id)))
    const mine = custom.map((title, i) => ({ id: `x${i}`, title, offset: 7, minutes: 15, who: 'anyone' as Who }))
    return [...base, ...mine]
  }, [tpl, off, on, custom])
  const valid = date >= today
  const dated = useMemo(() => generateSteps({ steps: chosen, date: valid ? date : today, today }), [chosen, date, today, valid])

  const flip = (id: string, optional?: boolean) => {
    const [set, setSet] = optional ? [on, setOn] : [off, setOff]
    const n = new Set(set)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setSet(n)
  }
  const isOn = (id: string, optional?: boolean) => (optional ? on.has(id) : !off.has(id))

  if (!tpl) {
    return (
      <div className="screen plan plan-a-thing">
        <ScreenHead eyebrow="Plan" title="Plan a thing" onBack={() => nav(-1)} />
        <p className="note">What are you getting ready for? We’ll break it into small steps and spread them out, so you only ever see the next one.</p>
        <ul className="pat-templates">
          {TEMPLATES.map((t) => (
            <li key={t.id}>
              <button type="button" className="card pick-row pat-template" onClick={() => pick(t)}>
                <span className="plan-emoji">{t.emoji}</span>
                <span className="grow">
                  <strong>{t.title}</strong>
                  <small className="muted">{t.blurb}</small>
                </span>
                <Icon name="chevron" size={18} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const create = () => {
    if (!dated.length && !name.trim()) return
    const { projectId, events } = createPlan(f, { template: tpl, name, date, steps: dated, planner: me.id, child: child || undefined })
    act(events)
    toast(dated.length ? 'Your plan is ready. The first step will turn up when it’s time.' : 'Added to the calendar.')
    nav(`/project/${projectId}`)
  }
  const addExtra = () => {
    const t = extra.trim()
    if (!t) return
    setCustom((c) => [...c, t])
    setExtra('')
  }

  return (
    <div className="screen plan plan-a-thing">
      <ScreenHead eyebrow={`${tpl.emoji} ${tpl.title}`} title="Plan a thing" onBack={() => setTpl(undefined)} />
      <section className="card">
        <label className="field">
          <span>What is it called?</span>
          <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder={tpl.defaultName} />
        </label>
        <label className="field">
          <span>When is it?</span>
          <input type="date" className="tbox" value={date} min={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        {!valid && <p className="note">Pick today or a day to come, and the steps will fit around it.</p>}
        {kids.length > 1 && tpl.steps.some((s) => s.who === 'child') && (
          <label className="field">
            <span>Which child gets the child steps?</span>
            <select className="tbox" value={child} onChange={(e) => setChild(e.target.value)}>
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <p className="pat-preview" role="status">
        {previewLine(dated, today)}
      </p>

      <h2 className="project-h2">Steps</h2>
      <ul className="pat-steps">
        {tpl.steps.map((s) => {
          const d = dated.find((x) => x.id === s.id)
          const checked = isOn(s.id, s.optional)
          return (
            <li key={s.id} className={checked ? '' : 'off'}>
              <label className="pat-step">
                <input type="checkbox" checked={checked} onChange={() => flip(s.id, s.optional)} />
                <span className="grow">
                  <span className="pat-title">{s.title}</span>
                  <small className="muted">
                    {[d ? friendlyDay(d.due, today) : s.optional ? 'Optional' : '', fmtDuration(s.minutes), WHO[s.who ?? 'anyone']].filter(Boolean).join(' · ')}
                  </small>
                </span>
              </label>
            </li>
          )
        })}
        {custom.map((c, i) => (
          <li key={`${c}${i}`}>
            <label className="pat-step">
              <input type="checkbox" checked onChange={() => setCustom((x) => x.filter((_, j) => j !== i))} />
              <span className="grow">
                <span className="pat-title">{c}</span>
                <small className="muted">Yours · {dated.find((x) => x.id === `x${i}`) ? friendlyDay(dated.find((x) => x.id === `x${i}`)!.due, today) : ''}</small>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="row-between pat-add">
        <input className="tbox slim grow" value={extra} onChange={(e) => setExtra(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExtra()} placeholder="Add a step of your own" aria-label="Add a step of your own" />
        <button type="button" className="btn small ghost" onClick={addExtra} disabled={!extra.trim()}>
          Add
        </button>
      </div>

      <div className="pat-foot">
        <button type="button" className="btn primary block" onClick={create}>
          <Icon name="check" size={18} /> Make my plan
        </button>
        <p className="note">The date goes on the calendar. Each step shows up on its own day, one or two at a time, and can wait if the day gets full.</p>
      </div>
    </div>
  )
}
