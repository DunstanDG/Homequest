/**
 * The railway station list for the travel planner. The master copy lives in the family's Supabase project
 * (`public.stations`, see supabase/schema_v4.sql) so it can be corrected without a rebuild. Each phone downloads
 * it the first time the picker opens and keeps a copy, so the picker works offline afterwards and refreshes at
 * most once a month.
 */
import { useEffect, useState } from 'react'
import { useApp } from './context'

export interface Station {
  crs: string
  name: string
}

/** v2: v1 copies could be cut short at Supabase's 1,000-row page limit, so they are fetched again. */
const KEY = 'stations-v2'
const PAGE = 1000
const MAX_AGE = 30 * 24 * 3600_000
/** Used before the list arrives (and in the demo), so the common stations still resolve. */
const FALLBACK: Station[] = [
  { crs: 'PRP', name: 'Preston Park' },
  { crs: 'HHE', name: 'Haywards Heath' },
  { crs: 'BTN', name: 'Brighton' },
  { crs: 'LWS', name: 'Lewes' },
  { crs: 'VIC', name: 'London Victoria' },
  { crs: 'LBG', name: 'London Bridge' },
  { crs: 'CLJ', name: 'Clapham Junction' },
  { crs: 'GTW', name: 'Gatwick Airport' },
]

type Cached = { at: number; list: Station[] }
let memo: Station[] | undefined

export function searchStations(list: readonly Station[], q: string, limit = 8): Station[] {
  const s = q.trim().toLowerCase()
  if (!s) return []
  const code = s.toUpperCase()
  const exact = list.filter((x) => x.crs === code)
  const starts = list.filter((x) => x.crs !== code && x.name.toLowerCase().startsWith(s))
  const words = list.filter((x) => x.crs !== code && !x.name.toLowerCase().startsWith(s) && x.name.toLowerCase().includes(` ${s}`))
  return [...exact, ...starts, ...words].slice(0, limit)
}

export const stationName = (list: readonly Station[], crs: string | undefined): string | undefined => (crs ? list.find((x) => x.crs === crs)?.name : undefined)

/** The station list: the phone's copy straight away, refreshed from Supabase when it is missing or old. */
export function useStations(): { list: Station[]; ready: boolean; error?: string } {
  const { repo, sync, demo } = useApp()
  const [list, setList] = useState<Station[]>(memo ?? FALLBACK)
  const [ready, setReady] = useState(!!memo)
  const [error, setError] = useState<string>()
  useEffect(() => {
    if (memo || demo) return
    let live = true
    ;(async () => {
      const kv = repo.storage.kv
      const cached = await kv.get<Cached>(KEY).catch(() => undefined)
      if (cached?.list?.length) {
        memo = cached.list
        if (live) (setList(cached.list), setReady(true))
        if (Date.now() - cached.at < MAX_AGE) return
      }
      const url = sync.effectiveUrl()
      const anon = sync.effectiveAnonKey()
      if (!url || !anon) {
        if (live && !cached) setError('Connect sharing first to load the station list.')
        return
      }
      try {
        // Supabase returns at most 1,000 rows per request, so read the list a page at a time.
        const rows: Station[] = []
        for (let from = 0; from < 20 * PAGE; from += PAGE) {
          const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/stations?select=crs,name&order=crs&limit=${PAGE}&offset=${from}`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } })
          if (!res.ok) throw new Error(res.status === 404 ? 'The stations table is not set up yet (run supabase/schema_v4.sql).' : `Could not load stations (${res.status}).`)
          const page = (await res.json()) as Station[]
          rows.push(...page)
          if (page.length < PAGE) break
        }
        rows.sort((a, b) => a.name.localeCompare(b.name))
        const clean = rows.filter((r) => typeof r.crs === 'string' && /^[A-Z]{3}$/.test(r.crs) && typeof r.name === 'string')
        if (!clean.length) throw new Error('The stations table is empty.')
        memo = clean
        await kv.set(KEY, { at: Date.now(), list: clean } satisfies Cached).catch(() => {})
        if (live) (setList(clean), setReady(true), setError(undefined))
      } catch (e) {
        if (live && !cached) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      live = false
    }
  }, [repo, sync, demo])
  return { list, ready, error }
}
