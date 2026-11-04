import { judge, solutionFor } from '@/engine/judge'
import type { Answer, Item } from '@/engine/types'
import type { Registry } from '@/engine/registry'

/**
 * Generic content-quality checks that apply to ANY subject pack. Used by the unit
 * tests and by `npm run audit:content`. Returns a list of human-readable problems.
 */
export function auditItem(item: Item): string[] {
  const problems: string[] = []
  const bad = (msg: string) => problems.push(msg)
  const text = `${item.prompt} ${item.explanation} ${item.hint ?? ''}`
  if (!item.prompt.trim()) bad('empty prompt')
  if (!item.explanation.trim()) bad('empty explanation')
  if (/undefined|NaN|\[object|Infinity/.test(text)) bad(`bad text: ${text.match(/undefined|NaN|\[object|Infinity/)?.[0]}`)
  const opens = (text.match(/\{/g) ?? []).length
  const closes = (text.match(/\}/g) ?? []).length
  if (opens !== closes) bad('unbalanced braces in text')
  if (item.difficulty < 1 || item.difficulty > 5) bad('difficulty out of range')

  // The stated solution must be judged correct.
  try {
    const sol = solutionFor(item)
    const j = judge(item, sol)
    if (!j.correct) bad(`own solution judged wrong (${j.expected} vs ${j.given}; ${j.misconception ?? ''})`)
  } catch (e) {
    bad(`solution threw: ${(e as Error).message}`)
  }

  switch (item.kind) {
    case 'numeric': {
      if (item.fields.length === 0) bad('no fields')
      for (const f of item.fields) {
        if (!Number.isFinite(f.answer)) bad('non-finite answer')
        if (Math.abs(f.answer) > 1e12) bad('absurd answer size')
      }
      if (item.template) {
        const slots = new Set([...item.template.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])))
        if (slots.size !== item.fields.length) bad('template slots != fields')
      } else if (item.fields.length > 1) bad('multi-field item without template')
      // A wrong answer must be judged wrong.
      const wrong: Answer = { kind: 'numeric', values: item.fields.map((f) => String(f.answer + 7.31)) }
      if (judge(item, wrong).correct) bad('wrong answer accepted')
      for (const e of item.commonErrors ?? []) {
        if (e.values && e.values.length === item.fields.length && e.values.every((v, i) => Math.abs(v - (item.fields[i]?.answer ?? NaN)) < 1e-9)) bad(`common error '${e.tag}' equals the correct answer`)
        if (e.values && e.values.some((v) => !Number.isFinite(v))) bad(`common error '${e.tag}' is not finite`)
      }
      break
    }
    case 'expr': {
      const wrong: Answer = { kind: 'expr', value: `${item.answer}+1000` }
      if (judge(item, wrong).correct) bad('wrong expression accepted')
      if (judge(item, { kind: 'expr', value: '' }).unparseable !== true) bad('empty expression not flagged unparseable')
      break
    }
    case 'choice': {
      const correct = item.options.filter((o) => o.correct)
      if (correct.length !== 1) bad(`${correct.length} correct options`)
      if (item.options.length < 2) bad('fewer than 2 options')
      if (new Set(item.options.map((o) => o.label)).size !== item.options.length) bad('duplicate option labels')
      const w = item.options.find((o) => !o.correct)
      if (w && judge(item, { kind: 'choice', optionId: w.id }).correct) bad('wrong option accepted')
      break
    }
    case 'order': {
      if (new Set(item.items.map((i) => i.id)).size !== item.items.length) bad('duplicate ids')
      if ([...item.correctOrder].sort().join() !== item.items.map((i) => i.id).sort().join()) bad('correctOrder is not a permutation')
      if (new Set(item.items.map((i) => i.label)).size !== item.items.length) bad('duplicate labels')
      if (item.items.every((it, i) => it.id === item.correctOrder[i])) bad('already in the correct order')
      break
    }
    case 'match': {
      if (item.pairs.length < 2) bad('fewer than 2 pairs')
      if (new Set(item.pairs.map((p) => p.left)).size !== item.pairs.length) bad('duplicate left labels')
      if (new Set(item.pairs.map((p) => p.right)).size !== item.pairs.length) bad('duplicate right labels')
      break
    }
    case 'text': {
      if (judge(item, { kind: 'text', value: 'zzzzqq' }).correct) bad('nonsense accepted')
      break
    }
    case 'reveal': {
      if (!item.model.trim()) bad('empty model answer')
      if (item.checklist.length < 2) bad('checklist needs at least 2 points')
      if (item.passMark < 1 || item.passMark > item.checklist.length) bad('passMark out of range')
      if (new Set(item.checklist).size !== item.checklist.length) bad('duplicate checklist points')
      if (judge(item, { kind: 'reveal', text: '', ticked: [] }).unparseable !== true) bad('empty written answer not flagged')
      if (judge(item, { kind: 'reveal', text: 'a long enough answer to count', ticked: [] }).correct) bad('nothing ticked but judged correct')
      break
    }
  }
  return problems
}

export interface AuditRow {
  generatorId: string
  skillId: string
  level: number
  seed: number
  problem: string
  prompt: string
}

/** Run every generator at every level it claims, over many seeds. */
export function auditRegistry(registry: Registry, seedsPerLevel = 150): AuditRow[] {
  const rows: AuditRow[] = []
  for (const pack of registry.packs.values()) {
    for (const g of pack.generators) {
      for (let level = g.levels[0]; level <= g.levels[1]; level++) {
        for (let s = 1; s <= seedsPerLevel; s++) {
          const seed = s * 7919 + level * 104729
          let item: Item
          try {
            item = registry.generateWith(g.id, level, seed)
          } catch (e) {
            rows.push({ generatorId: g.id, skillId: g.skillId, level, seed, problem: `threw: ${(e as Error).message}`, prompt: '' })
            break
          }
          const again = registry.generateWith(g.id, level, seed)
          if (JSON.stringify(again) !== JSON.stringify(item)) rows.push({ generatorId: g.id, skillId: g.skillId, level, seed, problem: 'not deterministic', prompt: item.prompt })
          for (const problem of auditItem(item)) rows.push({ generatorId: g.id, skillId: g.skillId, level, seed, problem, prompt: item.prompt })
        }
      }
    }
  }
  return rows
}
