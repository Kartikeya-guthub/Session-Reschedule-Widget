# Architecture Decisions

### 1. Why datetime is stored in UTC and displayed in local time
Time is absolute, but a user's perception of it is local. If a session is at 2:00 PM in New York, a user in India must see the exact same physical instant in their own timezone (11:30 PM). Storing `datetimeUTC` as an ISO 8601 string guarantees a single source of truth across all clients and servers. The only safe place to convert to local time is at the absolute edges of the application: immediately before rendering in the UI, and immediately after reading from a native `<input type="datetime-local">`.

### 2. Why the lead-time rule is enforced twice (UI + server)
The 2-hour lead-time rule is enforced in both `TimeSlotPicker.tsx` (UI) and `requestRescheduleHandler` (Server). Client-side enforcement provides immediate UX feedback (disabling slots and explaining why) without network latency. However, client-side validation can never be trusted. A user could leave the modal open for 30 minutes, turning a previously valid slot into a "too soon" slot, or maliciously bypass the UI entirely. The server must act as the final, authoritative gatekeeper.

### 3. Why the identical-slot check runs before the lead-time check
If a user selects the exact same slot they already have, the operation is a no-op regardless of how soon the session is. If the lead-time check ran first, a user trying to "reschedule" a session starting in 30 minutes to its *current* time would get a generic "Reschedules require 2 hours' notice" error. Checking identical slots first ensures the user gets the much more helpful and accurate "This is already your scheduled time" feedback.

### 4. Why the boundary at exactly 2h is inclusive
"At least 2 hours' notice" implies that an event exactly 2 hours and 0 seconds away is acceptable. Using a strict `<` operator in `isWithinLeadTime` ensures that the boundary itself (`now + 2 hours`) passes the validation check. This is a deliberate, precise interpretation of the business logic rather than a coincidence of which comparison operator was chosen.

### 5. Why requests carry both a `requestId` and `currentDatetimeUTC`
- **`requestId` (Idempotency):** Generated once per modal lifecycle, this allows the server to safely deduplicate identical resubmissions (e.g., if a user double-clicks the submit button, or a network timeout prompts an automatic retry). 
- **`currentDatetimeUTC` (Optimistic Concurrency):** Passing the slot the client *believes* is currently booked acts as a stale-session check. If an admin or another tab already rescheduled the session, the server compares the passed `currentDatetimeUTC` with its own database state. If they don't match, the server safely rejects the request rather than blindly overwriting the newer data.
