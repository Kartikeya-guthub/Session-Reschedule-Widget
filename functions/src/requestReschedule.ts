import { RescheduleRequestPayload, RescheduleResponse, Session } from '../../lib/types';
import { isWithinLeadTime } from '../../lib/time';
import { mockSessions } from '../../lib/mockData';

// Module-level idempotency store (plain Map — fine for a mock)
const idempotencyStore = new Map<string, RescheduleResponse>();

// We need a helper to find sessions since we use mockData.
function findSessionById(id: string): Session | undefined {
  return mockSessions.find((s) => s.id === id);
}

const REASONS = ['Conflict', 'Illness', 'Time zone', 'Other'];

// Deployed shape would be:
// export const requestReschedule = functions.https.onCall((data, ctx) => requestRescheduleHandler(data));

// Logic lives in a plain function so it's unit-testable without firebase-functions-test,
// and so the local mock transport (lib/firebase/functions.ts) can call it directly.
export function requestRescheduleHandler(
  payload: RescheduleRequestPayload,
  now: Date = new Date()
): RescheduleResponse {
  // 1. Idempotency check FIRST, before any other validation. If this exact requestId
  //    already resolved (a retry after a dropped response, a double-click that slipped
  //    past the UI guard), return the cached outcome verbatim rather than re-running the
  //    pipeline.
  const cached = idempotencyStore.get(payload.requestId);
  if (cached) return cached;

  // 2. Session lookup — never trust sessionId blindly.
  const session = findSessionById(payload.sessionId);
  if (!session) return respond({ success: false, error: 'Session not found.' });

  // 3. Stale-session check — the client's view of "current slot" vs. the server's.
  //    Catches the case where the session was already rescheduled (another tab, an admin,
  //    whatever) between the modal opening and this submit.
  if (session.datetimeUTC !== payload.currentDatetimeUTC) {
    return respond({
      success: false,
      error: 'This session was updated. Please refresh and try again.',
    });
  }

  // 4. Reason must be one of the four fixed values — cheap, syntactic, so it's checked
  //    early rather than after the date math below.
  if (!REASONS.includes(payload.reason)) {
    return respond({ success: false, error: 'Invalid reason.' });
  }

  // 5. New datetime must parse.
  const newSlot = new Date(payload.newDatetimeUTC);
  if (Number.isNaN(newSlot.getTime())) {
    return respond({ success: false, error: 'Invalid date.' });
  }

  // 6. Not in the past.
  if (newSlot.getTime() <= now.getTime()) {
    return respond({ success: false, error: 'That time has already passed.' });
  }

  // 7. Identical to the current slot, checked BEFORE the lead-time rule.
  //    A slot that is both "too soon" and "identical" should get the more specific,
  //    more useful message — there's nothing to change here regardless of the lead-time question.
  if (payload.newDatetimeUTC === session.datetimeUTC) {
    return respond({ success: false, error: 'This is already your scheduled time.' });
  }

  // 8. Re-check the 2h lead-time rule server-side even though Phase 4 already disables
  //    those slots in the UI. Never trust client-only validation — a modified request,
  //    a stale UI, or a slow submit that crosses the boundary could still arrive here.
  if (isWithinLeadTime(newSlot, now)) {
    return respond({
      success: false,
      error: "Reschedules require at least 2 hours' notice.",
    });
  }

  // 9. All checks passed — apply it, cache under requestId, return.
  const updatedSession: Session = { ...session, status: 'pending_reschedule' };
  
  // Actually mutate the mock data array so the UI reflects the change on refresh
  const index = mockSessions.findIndex(s => s.id === session.id);
  if (index !== -1) {
    mockSessions[index] = updatedSession;
  }

  return respond({ success: true });

  function respond(r: RescheduleResponse): RescheduleResponse {
    idempotencyStore.set(payload.requestId, r);
    return r;
  }
}
