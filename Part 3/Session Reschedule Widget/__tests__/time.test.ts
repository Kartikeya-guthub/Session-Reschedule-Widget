import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isWithinLeadTime } from '../lib/time';
import { requestRescheduleHandler } from '../functions/src/requestReschedule';
import { RescheduleRequestPayload } from '../lib/types';
import { mockSessions } from '../lib/mockData';

// We need an original session to test the handler
const mockSession = mockSessions[0];

describe('Time and Validation logic', () => {
  let originalTz: string | undefined;

  beforeEach(() => {
    originalTz = process.env.TZ;
  });

  afterEach(() => {
    if (originalTz) {
      process.env.TZ = originalTz;
    } else {
      delete process.env.TZ;
    }
  });

  it('India (UTC+5:30) → US (e.g. America/New_York) conversion round-trips correctly', () => {
    // Explicitly control the timezone to India
    process.env.TZ = 'Asia/Calcutta';
    
    // An absolute point in time: Aug 12, 2026, 14:00 UTC
    const instant = new Date('2026-08-12T14:00:00.000Z');
    
    // In India (UTC+5:30), that is 19:30 local
    const indiaFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Calcutta',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    // In NY (UTC-4 in August), that is 10:00 local
    const nyFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });

    expect(indiaFormatter.format(instant)).toContain('19:30:00');
    expect(nyFormatter.format(instant)).toContain('10:00:00');
  });

  it('A slot on either side of a US DST transition converts to the correct UTC instant', () => {
    process.env.TZ = 'America/New_York';
    
    // Fall back: Nov 1, 2026, 2:00 AM EDT -> 1:00 AM EST
    // Let's test the day before and the day after at the same local hour
    // Oct 31, 2026 12:00 PM EDT (UTC-4) -> 16:00 UTC
    const beforeDstEnd = new Date('2026-10-31T12:00:00');
    expect(beforeDstEnd.toISOString()).toBe('2026-10-31T16:00:00.000Z');

    // Nov 2, 2026 12:00 PM EST (UTC-5) -> 17:00 UTC
    const afterDstEnd = new Date('2026-11-02T12:00:00');
    expect(afterDstEnd.toISOString()).toBe('2026-11-02T17:00:00.000Z');
  });

  it('A slot exactly 2h00m00s from now → allowed (inclusive boundary)', () => {
    const now = new Date('2026-08-12T12:00:00.000Z');
    const exactly2h = new Date('2026-08-12T14:00:00.000Z');
    
    // Should NOT be within lead time (i.e. blocked = false, allowed = true)
    expect(isWithinLeadTime(exactly2h, now)).toBe(false);
  });

  it('A slot 1h59m from now → blocked', () => {
    const now = new Date('2026-08-12T12:00:00.000Z');
    const slightlyLess2h = new Date('2026-08-12T13:59:00.000Z');
    
    // Should be within lead time (i.e. blocked = true)
    expect(isWithinLeadTime(slightlyLess2h, now)).toBe(true);
  });

  it('A slot in the past → blocked, with the past-check message, not the lead-time one', () => {
    const now = new Date('2026-08-12T12:00:00.000Z');
    const past = new Date('2026-08-12T10:00:00.000Z'); // 2 hours ago
    
    const payload: RescheduleRequestPayload = {
      sessionId: mockSession.id,
      currentDatetimeUTC: mockSession.datetimeUTC,
      newDatetimeUTC: past.toISOString(),
      reason: 'Conflict',
      requestId: crypto.randomUUID()
    };

    const response = requestRescheduleHandler(payload, now);
    expect(response.success).toBe(false);
    expect(response.error).toBe('That time has already passed.');
  });

  it('A slot that is tomorrow-local but still today-UTC (or vice versa) resolves to the right day on both sides', () => {
    // Set local TZ to Asia/Tokyo (UTC+9)
    process.env.TZ = 'Asia/Tokyo';

    // 5:00 AM on Aug 12 in Tokyo
    const tokyoMorningLocalStr = '2026-08-12T05:00:00';
    const tokyoDate = new Date(tokyoMorningLocalStr);
    
    // In UTC, this should be Aug 11, 20:00 (8 PM previous day)
    expect(tokyoDate.toISOString()).toBe('2026-08-11T20:00:00.000Z');
    
    // The local date should parse exactly to the 12th
    expect(tokyoDate.getDate()).toBe(12);
    expect(tokyoDate.getHours()).toBe(5);
    
    // And getUTCDate() is the 11th
    expect(tokyoDate.getUTCDate()).toBe(11);
  });
});
