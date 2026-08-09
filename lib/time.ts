export const LEAD_TIME_MS = 2 * 60 * 60 * 1000; // 2h — tutoring ops needs this much notice to reassign/prep

// A <input type="datetime-local"> value has NO timezone info attached — "2026-08-12T14:00"
// is meaningless until you know whose 2pm it is. `new Date(value)` interprets a
// timezone-less string as local time in the browser's own timezone, which is exactly
// the parent's timezone — so this is the one safe place to do the conversion, at the
// boundary, immediately on read. Everything past this line in the app is UTC.
export function localInputToUTCISOString(localValue: string): string {
  return new Date(localValue).toISOString();
}

// "At least 2 hours' notice" reads as inclusive: a slot exactly 2h00m00s away should be
// bookable, not blocked. Strict `<` against the threshold means the boundary itself passes.
// This is a deliberate choice, not an accident of whichever operator got typed.
export function isWithinLeadTime(candidateUTC: Date, now: Date = new Date()): boolean {
  return candidateUTC.getTime() < now.getTime() + LEAD_TIME_MS;
}
