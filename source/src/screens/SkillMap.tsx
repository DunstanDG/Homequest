import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TIER_LABEL, dueAt, recentAccuracy, type Tier } from '@/engine/mastery'
import type { Registry } from '@/engine/registry'
import { skillRows, type SkillRow } from '@/engine/report'
import { useApp, useLearner, useNow } from '@/app/context'
import { Icon } from '@/ui/icons'
import { Bar, Pill, Sheet } from '@/ui/primitives'
import { SubjectPicker, useSubject } from './SubjectPicker'

const TONE: Record<Tier, 'neutral' | 'warn' | 'accent' | 'good' | 'xp'> = { new: 'neutral', learning: 'warn', developing: 'accent', secure: 'good', mastered: 'xp' }
const yearTag = (year: number) => (year < 7 ? `Yr ${year}` : `Year ${year}`)

function daysAgo(ts: number | undefined, now: number): string {
  if (!ts) return 'never'
  const d = Math.round((now - ts) / 86_400_000)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}

export function SkillMap() {
  const { registry } = useApp()
  const state = useLearner()
  const now = useNow()
  const subject = useSubject()
  const nav = useNavigate()
  const [open, setOpen] = useState<SkillRow | null>(null)
  const [showBlocks, setShowBlocks] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  const rows = skillRows(state, registry, now, subject).filter((r) => r.hasContent)
  const main = rows.filter((r) => r.skill.origin === 'syllabus')
  const blocks = rows.filter((r) => r.skill.origin === 'foundation')
  const mainYears = [8, 7]

  const group = (list: SkillRow[]) => {
    const by = new Map<string, SkillRow[]>()
    for (const r of list) by.set(r.skill.strand, [...(by.get(r.skill.strand) ?? []), r])
    return [...by.entries()]
  }

  const rowButton = (r: SkillRow) => (
    <button key={r.skill.id} type="button" className="skill-row" onClick={() => setOpen(r)}>
      <span className="sr-main">
        <strong>{r.skill.name}</strong>
        <small className="muted">
          {yearTag(r.skill.year)}
          {r.notTaught ? ' · not covered yet' : ''}
        </small>
      </span>
      <span className="sr-side">
        {r.due && <span className="due-dot" title="Ready for revision" />}
        <Pill tone={r.notTaught ? 'neutral' : TONE[r.tier]}>{r.notTaught ? 'Skipped' : TIER_LABEL[r.tier]}</Pill>
      </span>
    </button>
  )

  return (
    <div className="screen">
      <h1>Skills</h1>
      <SubjectPicker />
      <div className="chips">
        <button type="button" className={`chip small${view === 'list' ? ' selected' : ''}`} onClick={() => setView('list')}>
          List
        </button>
        <button type="button" className={`chip small${view === 'map' ? ' selected' : ''}`} onClick={() => setView('map')}>
          Map
        </button>
      </div>
      {view === 'map' && <SkillNodeMap rows={[...main, ...blocks]} registry={registry} onOpen={setOpen} />}
      {view === 'list' && mainYears.map((y) => {
        const list = main.filter((r) => r.skill.year === y)
        if (!list.length) return null
        return (
          <section key={y}>
            <h2 className="section">Year {y}</h2>
            {group(list).map(([strand, rs]) => {
              const secure = rs.filter((r) => r.tier === 'secure' || r.tier === 'mastered').length
              return (
                <div className="card strand" key={strand}>
                  <div className="strand-top">
                    <h3>{strand}</h3>
                    <small className="muted">
                      {secure}/{rs.length} secure
                    </small>
                  </div>
                  <Bar value={rs.length ? secure / rs.length : 0} tone="good" label={`${strand} progress`} />
                  <div className="skill-list">{rs.map(rowButton)}</div>
                </div>
              )
            })}
          </section>
        )
      })}

      {view === 'list' && blocks.length > 0 && (
        <section>
          <button type="button" className="btn ghost block" onClick={() => setShowBlocks((s) => !s)}>
            {showBlocks ? 'Hide' : 'Show'} building blocks from earlier years ({blocks.length})
          </button>
          {showBlocks &&
            group(blocks).map(([strand, rs]) => (
              <div className="card strand" key={strand}>
                <h3>{strand}</h3>
                <div className="skill-list">{rs.map(rowButton)}</div>
              </div>
            ))}
        </section>
      )}

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.skill.name}>
        {open && (
          <div className="skill-sheet">
            <div className="pills">
              <Pill tone={TONE[open.tier]}>{TIER_LABEL[open.tier]}</Pill>
              <Pill>{open.skill.origin === 'foundation' ? `Year ${open.skill.year} building block` : `Year ${open.skill.year}`}</Pill>
              <Pill>{open.skill.strand}</Pill>
            </div>
            <p>{open.skill.description}</p>
            {open.notTaught && <p className="note">Marked as not covered in class yet, so it is skipped for now.</p>}
            {open.stats && open.stats.n > 0 ? (
              <ul className="facts">
                <li>
                  <span>Answered</span>
                  <strong>
                    {open.stats.correct} right of {open.stats.n}
                  </strong>
                </li>
                <li>
                  <span>Recent accuracy</span>
                  <strong>{Math.round((recentAccuracy(open.stats) ?? 0) * 100)}%</strong>
                </li>
                <li>
                  <span>Last practised</span>
                  <strong>{daysAgo(open.stats.lastTs, now)}</strong>
                </li>
                <li>
                  <span>Revision</span>
                  <strong>{open.due ? 'Due now' : dueAt(open.stats) ? `in ${Math.max(1, Math.round(((dueAt(open.stats) as number) - now) / 86_400_000))} days` : '-'}</strong>
                </li>
              </ul>
            ) : (
              <p className="muted">You have not tried this one yet.</p>
            )}
            {open.skill.prereqs.length > 0 && (
              <p className="muted">
                Builds on: {open.skill.prereqs.map((p) => registry.graph.get(p).name).join(', ')}
              </p>
            )}
            <button
              type="button"
              className="btn primary big block"
              disabled={open.notTaught}
              onClick={() => nav(`/play/tower?subject=${subject}&focus=${open.skill.id}&go=1`)}
            >
              <Icon name="tower" size={20} /> Practise this
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}

const NODE_TONE: Record<Tier, string> = { new: 'var(--line)', learning: 'var(--warn, #e0b93c)', developing: 'var(--accent)', secure: 'var(--good)', mastered: 'var(--xp, gold)' }

/** A skill-tree-style visual over the same mastery data as the list: each node's fill reflects mastery, and lines
 * trace real prerequisite relationships, laid out left-to-right by how deep a skill sits in its prereq chain. */
function SkillNodeMap({ rows, registry, onOpen }: { rows: SkillRow[]; registry: Registry; onOpen: (r: SkillRow) => void }) {
  const byId = useMemo(() => new Map(rows.map((r) => [r.skill.id, r])), [rows])

  const depthOf = useMemo(() => {
    const cache = new Map<string, number>()
    const visiting = new Set<string>()
    const go = (id: string): number => {
      if (cache.has(id)) return cache.get(id)!
      if (visiting.has(id) || !byId.has(id)) return 0 // guard against cycles or a prereq outside this view
      visiting.add(id)
      const prereqIds = registry.graph.prereqsOf(id).map((p) => p.id).filter((p) => byId.has(p))
      const d = prereqIds.length ? 1 + Math.max(...prereqIds.map(go)) : 0
      visiting.delete(id)
      cache.set(id, d)
      return d
    }
    for (const r of rows) go(r.skill.id)
    return cache
  }, [rows, byId, registry])

  const cols = new Map<number, SkillRow[]>()
  for (const r of rows) {
    const d = depthOf.get(r.skill.id) ?? 0
    cols.set(d, [...(cols.get(d) ?? []), r])
  }
  const maxDepth = Math.max(0, ...cols.keys())
  const COL_W = 92
  const ROW_H = 68
  const R = 22
  const maxRows = Math.max(1, ...[...cols.values()].map((c) => c.length))
  const width = (maxDepth + 1) * COL_W + 40
  const height = maxRows * ROW_H + 40

  const pos = new Map<string, { x: number; y: number }>()
  for (const [d, list] of cols) list.forEach((r, i) => pos.set(r.skill.id, { x: 30 + d * COL_W, y: 30 + i * ROW_H + (maxRows - list.length) * (ROW_H / 2) }))

  const edges: { from: { x: number; y: number }; to: { x: number; y: number } }[] = []
  for (const r of rows) {
    const to = pos.get(r.skill.id)
    if (!to) continue
    for (const p of registry.graph.prereqsOf(r.skill.id)) {
      const from = pos.get(p.id)
      if (from) edges.push({ from, to })
    }
  }

  return (
    <div className="skill-map card">
      <p className="muted small">Lines show real prerequisites. Colour is mastery, same as the list.</p>
      <div style={{ overflowX: 'auto' }}>
        <svg width={width} height={height} role="img" aria-label="Skill map">
          {edges.map((e, i) => (
            <line key={i} x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke="var(--line)" strokeWidth={1.5} />
          ))}
          {rows.map((r) => {
            const p = pos.get(r.skill.id)
            if (!p) return null
            return (
              <g key={r.skill.id} className="skill-node" onClick={() => onOpen(r)} transform={`translate(${p.x},${p.y})`}>
                <circle r={R} fill={r.notTaught ? 'var(--surface)' : NODE_TONE[r.tier]} stroke="var(--line)" strokeWidth={1.5} opacity={r.notTaught ? 0.4 : 1} />
                <text textAnchor="middle" dy={4}>
                  {r.skill.name.slice(0, 3)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
