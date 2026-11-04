/** Context-isolated comment threads on a calendar event or task. A thread is scoped strictly to its `targetId` —
 * comments never leak between one event/task and another. Pure selectors only; writes are in actions.ts. */
import type { CommentEvent, FamilyState } from './types'

export function commentsFor(f: FamilyState, targetId: string): CommentEvent[] {
  return Object.values(f.comments)
    .filter((c) => c.targetId === targetId && !c.deleted)
    .sort((a, b) => a.ts - b.ts)
}
