import type { AppEvent } from '@/engine/types'

export interface Backup {
  format: 'studyquest-backup'
  version: 1
  exportedAt: number
  learnerId: string
  events: AppEvent[]
}

export function makeBackup(learnerId: string, events: AppEvent[], now = Date.now()): string {
  const b: Backup = { format: 'studyquest-backup', version: 1, exportedAt: now, learnerId, events }
  return JSON.stringify(b)
}

const isEvent = (e: unknown): e is AppEvent => {
  if (typeof e !== 'object' || e === null) return false
  const o = e as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.ts === 'number' && typeof o.type === 'string' && typeof o.learnerId === 'string' && typeof o.day === 'string'
}

/** Validates a backup file. Returns a readable error instead of throwing. */
export function parseBackup(text: string): { ok: true; backup: Backup } | { ok: false; error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  const o = raw as Partial<Backup> | null
  if (!o || o.format !== 'studyquest-backup' || !Array.isArray(o.events) || typeof o.learnerId !== 'string') return { ok: false, error: 'That does not look like a StudyQuest backup file.' }
  const bad = o.events.findIndex((e) => !isEvent(e))
  if (bad >= 0) return { ok: false, error: `Event ${bad + 1} in the file is damaged.` }
  return { ok: true, backup: o as Backup }
}
