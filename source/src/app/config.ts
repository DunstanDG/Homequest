export const APP_NAME = 'HomeQuest'
export const APP_VERSION = '0.2.0'
export const DEFAULT_YEAR = 8
/**
 * XP that completes the daily quest: about one Skill Tower run. Simulated learners earn roughly 150-230 XP per
 * 10-question run (about 55 if every answer is wrong), so 120 takes a real go but is not a grind.
 */
export const DAILY_QUEST_XP = 120
/** Parent area re-locks after this long. */
export const PARENT_UNLOCK_MS = 5 * 60_000

/** Optional build-time defaults for the parent's Supabase project (see docs/FEEDBACK_LOOP.md). */
export const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || undefined
export const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || undefined
/** Optional: the project's publishable key (`sb_publishable_...`, Settings > API Keys). Public, like the anon key.
 * Edge Functions that check keys with Supabase's newer gateway don't accept the legacy anon key, so the AI breakdown
 * call uses this when it's set. */
export const ENV_SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || undefined

/**
 * Optional build-time default for the family's VAPID public key (Phase 1 web push - see
 * docs/PUSH_NOTIFICATIONS.md). Safe to ship in the client bundle: it identifies the sender to the push
 * service, it cannot be used to send notifications on its own. The matching private key never appears here -
 * it lives only as a secret on the Supabase Edge Function that actually sends pushes.
 */
export const ENV_VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || undefined

/** App updates are now release notes by day: see src/app/onboarding/releases.ts. */
