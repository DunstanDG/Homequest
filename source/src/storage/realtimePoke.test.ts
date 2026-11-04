import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openPokeChannel, pokeTopicFor, realtimeSocketUrl } from './realtimePoke'

/** Just enough of a WebSocket to watch what the poke channel sends and feed it what Supabase Realtime replies. */
class FakeSocket {
  static OPEN = 1
  static all: FakeSocket[] = []
  readyState = 0
  sent: { topic: string; event: string; payload: any; ref: string }[] = []
  onopen?: () => void
  onmessage?: (e: { data: string }) => void
  onclose?: () => void
  onerror?: () => void
  constructor(public url: string) {
    FakeSocket.all.push(this)
  }
  send(data: string) {
    this.sent.push(JSON.parse(data))
  }
  close() {
    if (this.readyState === 3) return
    this.readyState = 3
    this.onclose?.()
  }
  // test helpers
  open() {
    this.readyState = 1
    this.onopen?.()
  }
  reply(msg: object) {
    this.onmessage?.({ data: JSON.stringify(msg) })
  }
}

describe('realtime poke channel', () => {
  beforeEach(() => {
    FakeSocket.all = []
    vi.stubGlobal('WebSocket', FakeSocket)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('derives a stable topic that does not contain the family key', async () => {
    const a = await pokeTopicFor('family-key-abcdef-123456')
    expect(a).toMatch(/^hq-[0-9a-f]{32}$/)
    expect(a).toBe(await pokeTopicFor('family-key-abcdef-123456'))
    expect(a).not.toBe(await pokeTopicFor('another-family-key-0000'))
    expect(a).not.toContain('family-key')
  })

  it('connects to the Supabase Realtime websocket with the anon key', () => {
    expect(realtimeSocketUrl('https://abc.supabase.co/', 'anon123')).toBe('wss://abc.supabase.co/realtime/v1/websocket?apikey=anon123&vsn=1.0.0')
  })

  it('joins a public broadcast channel, reports connected, calls onPoke for a poke and sends one when asked', async () => {
    const onPoke = vi.fn()
    const onStatus = vi.fn()
    const ch = openPokeChannel({ url: 'https://abc.supabase.co', anonKey: 'anon', familyKey: 'family-key-abcdef-123456', onPoke, onStatus })
    await vi.waitFor(() => expect(FakeSocket.all).toHaveLength(1)) // topic hashing is async
    const ws = FakeSocket.all[0]!
    ws.open()
    const join = ws.sent[0]!
    const topic = `realtime:${await pokeTopicFor('family-key-abcdef-123456')}`
    expect(join.topic).toBe(topic)
    expect(join.event).toBe('phx_join')
    expect(join.payload.config.broadcast).toEqual({ self: false, ack: false })
    expect(join.payload.config.private).toBe(false)

    ch.poke() // not joined yet - dropped, nothing sent
    expect(ws.sent).toHaveLength(1)

    ws.reply({ topic, event: 'phx_reply', payload: { status: 'ok', response: {} }, ref: join.ref })
    expect(onStatus).toHaveBeenLastCalledWith(true)

    ws.reply({ topic, event: 'broadcast', payload: { type: 'broadcast', event: 'poke', payload: {} } })
    expect(onPoke).toHaveBeenCalledTimes(1)
    ws.reply({ topic: 'realtime:someone-else', event: 'broadcast', payload: { type: 'broadcast', event: 'poke', payload: {} } })
    expect(onPoke).toHaveBeenCalledTimes(1) // other topics ignored

    ch.poke()
    const sent = ws.sent[ws.sent.length - 1]!
    expect(sent).toMatchObject({ topic, event: 'broadcast', payload: { type: 'broadcast', event: 'poke', payload: {} } })
    ch.close()
    expect(onStatus).toHaveBeenLastCalledWith(false)
  })

  it('reconnects after the socket drops, and stops for good once closed', async () => {
    const ch = openPokeChannel({ url: 'https://abc.supabase.co', anonKey: 'anon', familyKey: 'family-key-abcdef-123456', onPoke: () => {} })
    await vi.waitFor(() => expect(FakeSocket.all).toHaveLength(1)) // real timers while the topic hash resolves
    vi.useFakeTimers()
    FakeSocket.all[0]!.open()
    FakeSocket.all[0]!.close() // network blip
    await vi.advanceTimersByTimeAsync(1_000)
    expect(FakeSocket.all).toHaveLength(2)
    ch.close()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(FakeSocket.all).toHaveLength(2)
  })
})
