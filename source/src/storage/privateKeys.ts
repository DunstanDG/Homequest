/**
 * Personal keys for private events. Each person has one random 128-bit key, made on their own phone and kept in this phone's
 * local storage (never in the shared log). Events private to them are stored on the server with that key, and the server only
 * returns such rows to a request that presents it.
 *
 * A key reaches a second phone as a code: `hqk1.<memberId>.<key>`. A parent may be given a copy of anyone's code (children's
 * are required) so a lost phone can be restored; a copy is only ever handed on, it is never sent to the server in a request, so
 * the parent's phone does not receive the other person's private rows.
 */
import type { KV } from './types'

const KEY = 'private.keys'

export interface KeyStore {
  /** The key of the person holding this phone. */
  own?: { memberId: string; key: string }
  /** Copies of other people's keys, held to restore them. memberId -> key. */
  copies: Record<string, string>
}

export const emptyKeys = (): KeyStore => ({ copies: {} })

export const loadKeys = async (kv: KV): Promise<KeyStore> => ({ ...emptyKeys(), ...((await kv.get<KeyStore>(KEY)) ?? {}) })
export const saveKeys = (kv: KV, k: KeyStore): Promise<void> => kv.set(KEY, k)

const hex = (bytes: Uint8Array): string => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')

/** A fresh random key (32 hex characters = 128 bits). */
export function newKey(): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return hex(b)
}

export const keyCode = (memberId: string, key: string): string => `hqk1.${memberId}.${key}`

export function parseKeyCode(code: string): { memberId: string; key: string } | undefined {
  const m = /^hqk1\.([A-Za-z0-9_-]+)\.([0-9a-f]{32})$/.exec(code.trim())
  return m ? { memberId: m[1]!, key: m[2]! } : undefined
}

/** A short public fingerprint of a key: enough to tell whether a copy matches, useless for finding the key. */
export async function fingerprint(key: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`hq-fp:${key}`))
  return hex(new Uint8Array(d)).slice(0, 12)
}
