/**
 * A "family code" is the one thing a person needs to join the family on a new phone:
 *   hq1.<secret>
 * The secret is the sync password (sent as a header, checked by row-level security on the server).
 * Treat it like a password.
 *
 * StudyQuest's older codes, sq1.<learnerId>.<secret>, still work: they carry the same secret, plus a hint about which
 * learner's progress was being shared (so a phone joining with one can link that child up automatically).
 */
export interface FamilyCode {
  familyKey: string
  /** Only present on old sq1 codes. */
  learnerId?: string
}

const randomToken = (bytes: number): string => {
  const arr = new Uint8Array(bytes)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr)
  else for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256)
  return [...arr].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, bytes * 2)
}

export function newFamilyCode(): string {
  return `hq1.${randomToken(16)}`
}

export const familyCodeFor = (familyKey: string): string => `hq1.${familyKey}`

export function parseFamilyCode(code: string): FamilyCode | null {
  const c = code.trim()
  const v2 = /^hq1\.([A-Za-z0-9]{16,64})$/.exec(c)
  if (v2) return { familyKey: v2[1] as string }
  const v1 = /^sq1\.([A-Za-z0-9_-]{4,64})\.([A-Za-z0-9]{16,64})$/.exec(c)
  return v1 ? { learnerId: v1[1] as string, familyKey: v1[2] as string } : null
}
