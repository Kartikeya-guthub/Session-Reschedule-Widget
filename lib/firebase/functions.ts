'use client';

import { RescheduleRequestPayload, RescheduleResponse, Session } from '../types';
import { isWithinLeadTime } from '../time';
import { mockSessions } from '../mockData';

// ─── Idempotency store (module-level Map, fine for a mock) ───
const idempotencyStore = new Map<string, RescheduleResponse>();

function findSessionById(id: string): Session | undefined {
  return mockSessions.find((s) => s.id === id);
}

const REASONS = ['Conflict', 'Illness', 'Time zone', 'Other'];

function requestRescheduleHandler(
  payload: RescheduleRequestPayload,
  now: Date = new Date()
): RescheduleResponse {
  const cached = idempotencyStore.get(payload.requestId);
  if (cached) return cached;

  const session = findSessionById(payload.sessionId);
  if (!session) return respond({ success: false, error: 'Session not found.' });

  if (session.datetimeUTC !== payload.currentDatetimeUTC) {
    return respond({
      success: false,
      error: 'This session was updated. Please refresh and try again.',
    });
  }

  if (!REASONS.includes(payload.reason)) {
    return respond({ success: false, error: 'Invalid reason.' });
  }

  const newSlot = new Date(payload.newDatetimeUTC);
  if (Number.isNaN(newSlot.getTime())) {
    return respond({ success: false, error: 'Invalid date.' });
  }

  if (newSlot.getTime() <= now.getTime()) {
    return respond({ success: false, error: 'That time has already passed.' });
  }

  if (payload.newDatetimeUTC === session.datetimeUTC) {
    return respond({ success: false, error: 'This is already your scheduled time.' });
  }

  if (isWithinLeadTime(newSlot, now)) {
    return respond({
      success: false,
      error: "Reschedules require at least 2 hours' notice.",
    });
  }

  const updatedSession: Session = { ...session, status: 'pending_reschedule' };
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

// Mock callable — instant for debugging
export async function requestReschedule(payload: RescheduleRequestPayload): Promise<RescheduleResponse> {
  try {
    const result = requestRescheduleHandler(payload);
    return result;
  } catch (e) {
    console.error('requestReschedule error:', e);
    return { success: false, error: 'Internal error. Please try again.' };
  }
}
