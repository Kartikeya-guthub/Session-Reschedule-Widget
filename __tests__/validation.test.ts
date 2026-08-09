import { describe, it, expect } from 'vitest';
import { requestRescheduleHandler } from '../functions/src/requestReschedule';
import { RescheduleRequestPayload } from '../lib/types';
import { mockSessions } from '../lib/mockData';

// We use the first mock session for testing
const mockSession = mockSessions[0];

describe('Validation Logic', () => {

  it('The exact current slot resubmitted → blocked with "already your scheduled time" (even if inside lead-time)', () => {
    // We intentionally set 'now' so that the current session time is within the 2h lead time.
    // If the check order was wrong, it would return the lead-time error.
    const mockNow = new Date(mockSession.datetimeUTC);
    mockNow.setMinutes(mockNow.getMinutes() - 30); // only 30 mins lead time

    const payload: RescheduleRequestPayload = {
      sessionId: mockSession.id,
      currentDatetimeUTC: mockSession.datetimeUTC,
      newDatetimeUTC: mockSession.datetimeUTC, // Identical to current slot
      reason: 'Conflict',
      requestId: crypto.randomUUID()
    };

    const response = requestRescheduleHandler(payload, mockNow);
    
    expect(response.success).toBe(false);
    expect(response.error).toBe('This is already your scheduled time.');
  });

  it('A repeated requestId returns the cached response without re-running validation', () => {
    const requestId = crypto.randomUUID();
    
    // First request is completely invalid (session doesn't exist)
    const payload1: RescheduleRequestPayload = {
      sessionId: 'fake-session',
      currentDatetimeUTC: '2026-08-12T10:00:00.000Z',
      newDatetimeUTC: '2026-08-12T14:00:00.000Z',
      reason: 'Conflict',
      requestId
    };

    const response1 = requestRescheduleHandler(payload1, new Date());
    expect(response1.success).toBe(false);
    expect(response1.error).toBe('Session not found.');

    // Second request uses the SAME requestId, but now we pass a VALID payload.
    // Because idempotency is checked first, it should immediately return the cached 'Session not found.' error.
    const validSession = mockSessions[1];
    const mockNow = new Date(validSession.datetimeUTC);
    mockNow.setHours(mockNow.getHours() - 48); // plenty of lead time
    const newSlot = new Date(validSession.datetimeUTC);
    newSlot.setHours(newSlot.getHours() + 24);

    const payload2: RescheduleRequestPayload = {
      sessionId: validSession.id,
      currentDatetimeUTC: validSession.datetimeUTC,
      newDatetimeUTC: newSlot.toISOString(),
      reason: 'Conflict',
      requestId // Same requestId!
    };

    const response2 = requestRescheduleHandler(payload2, mockNow);
    
    // It returns the EXACT same object cached from payload1
    expect(response2).toEqual(response1);
    expect(response2.error).toBe('Session not found.');
  });

  it('A payload whose currentDatetimeUTC doesn’t match the server’s session returns the stale-session error', () => {
    // Simulate a scenario where the UI thought the session was at 10:00, 
    // but the server actually has it at a different time (e.g. from mockSession.datetimeUTC)
    const staleTime = '2020-01-01T10:00:00.000Z';
    
    // Sanity check that the stale time isn't accidentally equal to the real time
    expect(staleTime).not.toBe(mockSession.datetimeUTC);

    const payload: RescheduleRequestPayload = {
      sessionId: mockSession.id,
      currentDatetimeUTC: staleTime, // Stale!
      newDatetimeUTC: '2026-08-12T14:00:00.000Z',
      reason: 'Conflict',
      requestId: crypto.randomUUID()
    };

    const response = requestRescheduleHandler(payload, new Date());
    
    expect(response.success).toBe(false);
    expect(response.error).toBe('This session was updated. Please refresh and try again.');
  });
});
