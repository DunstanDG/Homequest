import { afterEach, describe, expect, it, vi } from 'vitest'
import * as A from '@/family/actions'
import { careRecipients, feedReminderTag, recipientTag } from '@/family/notify'
import { projectFamily } from '@/family/project'
import { cancelNotificationFor, scheduleNotificationFor } from './push'
import type { SyncManager } from './syncManager'

const family = () =>
  projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#111', active: true }, 1),
    ...A.saveMember('dad', { id: 'mum', name: 'Mum', role: 'parent', colour: '#222', active: true }, 2),
    ...A.saveMember('dad', { id: 'maya', name: 'Maya', role: 'child', colour: '#333', active: true }, 3),
    ...A.saveMember('dad', { id: 'robin', name: 'Robin', role: 'baby', colour: '#444', active: true }, 4),
    ...A.saveMember('dad', { id: 'gran', name: 'Gran', role: 'parent', colour: '#555', active: false }, 5),
  ])

const sync = { config: () => ({ familyKey: 'family-key-abcdef-123456' }), effectiveUrl: () => 'https://abc.supabase.co', effectiveAnonKey: () => 'anon' } as unknown as SyncManager

describe('baby-care reminders go to parents only', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('picks the active parents - never a child, the baby, or someone inactive', () => {
    expect(careRecipients(family()).sort()).toEqual(['dad', 'mum'])
  })

  it('queues one targeted copy per parent, after clearing the old untargeted copy and every per-person copy', async () => {
    const calls: { url: string; method: string; body?: unknown }[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined })
      return new Response(null, { status: 201 })
    })
    const tag = feedReminderTag('robin')
    await scheduleNotificationFor(sync, careRecipients(family()), { fireAt: Date.UTC(2026, 9, 3, 3, 0), title: 'Robin: feed due soon', body: 'x', tag })
    const deletes = calls.filter((c) => c.method === 'DELETE').map((c) => decodeURIComponent(c.url))
    expect(deletes.some((u) => u.includes(`tag=eq.${tag}&`))).toBe(true) // the pre-fix copy that went to every phone
    expect(deletes.some((u) => u.includes(`tag=like.${tag}:*`))).toBe(true)
    const post = calls.find((c) => c.method === 'POST')!
    const rows = post.body as { member_id: string; tag: string }[]
    expect(rows.map((r) => r.member_id).sort()).toEqual(['dad', 'mum'])
    expect(rows.every((r) => r.tag === recipientTag(tag, r.member_id))).toBe(true)
  })

  it('with nobody to send to, only clears', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => (calls.push(init.method ?? 'GET'), new Response(null, { status: 204 })))
    await scheduleNotificationFor(sync, [], { fireAt: Date.now() + 60_000, title: 't', body: 'b', tag: 'sleep:x' })
    expect(calls).toEqual(['DELETE', 'DELETE'])
    calls.length = 0
    await cancelNotificationFor(sync, 'sleep:x')
    expect(calls).toEqual(['DELETE', 'DELETE'])
  })
})
