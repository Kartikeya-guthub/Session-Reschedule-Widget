export type RescheduleReason = 'Conflict' | 'Illness' | 'Time zone' | 'Other';

export type SessionStatus = 'confirmed' | 'pending_reschedule' | 'cancelled';

export interface Session {
  id: string;
  subject: string;
  teacherName: string;
  datetimeUTC: string; // ISO 8601, always UTC — see ARCHITECTURE.md
  status: SessionStatus;
}

export interface RescheduleRequestPayload {
  sessionId: string;
  // The slot the client believes is currently booked. The server compares this
  // against its own record before applying the change — see Phase 5 stale-session check.
  currentDatetimeUTC: string;
  newDatetimeUTC: string;
  reason: RescheduleReason;
  note?: string;
  // Client-generated, stable for the lifetime of one submit attempt (including retries).
  // Lets the server dedupe identical resubmissions — see Phase 3 + Phase 5.
  requestId: string;
}

export interface RescheduleResponse {
  success: boolean;
  error?: string;
}
