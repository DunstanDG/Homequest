/**
 * Instant sync, the cheap way: a Supabase Realtime **Broadcast** "poke" channel shared by the family's phones.
 *
 * Why not Realtime's postgres_changes (stream the new rows themselves)? The `events` table's row-level security
 * reads the family key from an HTTP request header (`x-family-key`, see supabase/schema.sql). Realtime evaluates
 * RLS from the websocket's JWT, not from request headers, so it would see no family key and deliver nothing (or,
 * with RLS loosened, every family's rows). Rather than change the security model, no event data crosses this
 * channel at all: when a phone uploads new events it broadcasts an empty "poke", and every other phone listening
 * runs its normal header-authenticated sync straight away instead of waiting for the next 25-second poll.
 *
 * The channel name is a SHA-256 of the family key, so it can't be guessed or reversed. Anyone who did learn it
 * could only make the family's phones sync a little more often - the payload is always empty. If the socket can't
 * connect (Realtime off, public channels disabled, no network) nothing breaks: polling carries on as before.
 *
 * Speaks the Phoenix channel protocol (vsn 1.0.0, JSON) directly over a WebSocket - no @supabase/supabase-js,
 * same no-SDK approach as storage/supabase.ts.
 */

export interface PokeChannel {
  /** Tell the family's other phones there's something new to pull. Dropped silently if not connected. */
  poke(): void
  close(): void
}

export interface PokeOptions {
  url: string
  anonKey: string
  familyKey: string
  onPoke: () => void
  onStatus?: (connected: boolean) => void
}

const HEARTBEAT_MS = 25_000
const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000, 30_000]

/** `hq-` + first 32 hex chars of SHA-256(family key). Undefined where SubtleCrypto isn't available (non-HTTPS). */
export async function pokeTopicFor(familyKey: string): Promise<string | undefined> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined
  if (!subtle) return undefined
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(`homequest-poke:${familyKey}`))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `hq-${hex.slice(0, 32)}`
}

export const realtimeSocketUrl = (url: string, anonKey: string): string =>
  `${url.replace(/\/+$/, '').replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${encodeURIComponent(anonKey)}&vsn=1.0.0`

export function openPokeChannel(opts: PokeOptions): PokeChannel {
  let ws: WebSocket | undefined
  let topic: string | undefined
  let joined = false
  let closed = false
  let ref = 0
  let attempt = 0
  let heartbeat: ReturnType<typeof setInterval> | undefined
  let retry: ReturnType<typeof setTimeout> | undefined

  const send = (msg: { topic: string; event: string; payload: unknown }) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ...msg, ref: String(++ref) }))
  }
  const setJoined = (v: boolean) => {
    if (joined === v) return
    joined = v
    opts.onStatus?.(v)
  }

  const scheduleReconnect = () => {
    if (closed) return
    clearTimeout(retry)
    retry = setTimeout(connect, BACKOFF_MS[Math.min(attempt++, BACKOFF_MS.length - 1)])
  }

  const connect = () => {
    if (closed || !topic || typeof WebSocket === 'undefined') return
    try {
      ws = new WebSocket(realtimeSocketUrl(opts.url, opts.anonKey))
    } catch {
      return scheduleReconnect()
    }
    const channel = `realtime:${topic}`
    ws.onopen = () => {
      send({ topic: channel, event: 'phx_join', payload: { config: { broadcast: { self: false, ack: false }, presence: { key: '' }, postgres_changes: [], private: false }, access_token: opts.anonKey } })
      clearInterval(heartbeat)
      heartbeat = setInterval(() => send({ topic: 'phoenix', event: 'heartbeat', payload: {} }), HEARTBEAT_MS)
    }
    ws.onmessage = (e) => {
      let msg: { topic?: string; event?: string; payload?: { status?: string; event?: string } }
      try {
        msg = JSON.parse(String(e.data))
      } catch {
        return
      }
      if (msg.topic !== channel) return
      if (msg.event === 'phx_reply' && msg.payload?.status === 'ok' && !joined) {
        attempt = 0
        setJoined(true)
      } else if (msg.event === 'phx_reply' && msg.payload?.status === 'error') {
        ws?.close()
      } else if (msg.event === 'broadcast' && msg.payload?.event === 'poke') {
        opts.onPoke()
      } else if (msg.event === 'phx_close' || msg.event === 'phx_error') {
        ws?.close()
      }
    }
    ws.onclose = () => {
      clearInterval(heartbeat)
      setJoined(false)
      ws = undefined
      scheduleReconnect()
    }
    ws.onerror = () => ws?.close()
  }

  // Phones drop sockets in the background; reconnect as soon as the app is back on screen.
  const onVisible = () => {
    if (document.visibilityState === 'visible' && !ws && !closed) {
      attempt = 0
      clearTimeout(retry)
      connect()
    }
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible)

  void pokeTopicFor(opts.familyKey).then((t) => {
    topic = t
    connect()
  })

  return {
    poke: () => {
      if (joined && topic) send({ topic: `realtime:${topic}`, event: 'broadcast', payload: { type: 'broadcast', event: 'poke', payload: {} } })
    },
    close: () => {
      closed = true
      clearTimeout(retry)
      clearInterval(heartbeat)
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      setJoined(false)
      ws?.close()
    },
  }
}
