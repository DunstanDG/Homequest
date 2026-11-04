import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import type { FamilyState, MemberId } from './types'

/** Say that `holder` holds a copy of `memberId`'s private key (only a fingerprint goes in the log, never the key). */
export const saveKeyCopy = (actor: MemberId, memberId: MemberId, holder: MemberId, fp: string, removed = false, now = Date.now()): AppEvent[] => [
  makeEvent(actor, { type: 'key-copy', memberId, holder, fp, removed: removed || undefined }, now),
]

/** Copies of this person's key that someone holds, newest first. */
export const copiesOf = (f: FamilyState, memberId: MemberId) =>
  Object.values(f.keyCopies)
    .filter((c) => c.memberId === memberId && !c.removed)
    .sort((a, b) => b.ts - a.ts)

/** Does a parent hold a copy of exactly this key? (Required before a child can mark anything private.) */
export const parentHoldsCopy = (f: FamilyState, memberId: MemberId, fp: string): boolean =>
  copiesOf(f, memberId).some((c) => c.fp === fp && f.members[c.holder]?.role === 'parent' && c.holder !== memberId)
