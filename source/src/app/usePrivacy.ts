import { useEffect, useState } from 'react'
import { parentHoldsCopy } from '@/family/privacyActions'
import { fingerprint } from '@/storage/privateKeys'
import { useApp, useFamily, useMe, useSyncStatus } from './context'

export interface PrivacyStatus {
  /** The database can store private events (schema_v3.sql has been run, or nothing is shared). Undefined = not checked yet. */
  dbReady?: boolean
  hasKey: boolean
  /** A child needs a parent to hold a copy of their key first. */
  needsCopy: boolean
  /** Private can be used right now. */
  ok: boolean
  /** Why not, in a sentence for the screen. */
  why?: string
}

/** Whether this person can mark things private on this phone right now, and if not, what is missing. */
export function usePrivacy(): PrivacyStatus {
  const { sync } = useApp()
  useSyncStatus()
  const f = useFamily()
  const me = useMe()
  const own = sync.ownKey()
  const [fp, setFp] = useState<string | undefined>()
  useEffect(() => {
    let live = true
    if (!own) setFp(undefined)
    else void fingerprint(own).then((x) => live && setFp(x))
    return () => {
      live = false
    }
  }, [own])
  const hasKey = !!own
  const child = me?.role === 'child'
  const needsCopy = child && hasKey && !(me && fp && parentHoldsCopy(f, me.id, fp))
  const dbReady = sync.privateReady
  const ok = dbReady === true && hasKey && !needsCopy
  const why =
    dbReady === false
      ? 'Run the database update first (supabase/schema_v3.sql), then check again.'
      : dbReady === undefined
        ? 'Checking the database…'
        : !hasKey
          ? 'Make your private key first.'
          : needsCopy
            ? 'A parent needs to hold a copy of your key first.'
            : undefined
  return { dbReady, hasKey, needsCopy, ok, why }
}
