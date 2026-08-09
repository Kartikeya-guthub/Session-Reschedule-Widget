# Debe Learning — Tech Intern Assessment

## Part 1 — GitHub Portfolio Walkthrough

### GitHub Profile
https://github.com/Kartikeya-guthub

### Repository 1 — Event-Driven Order & Payment System
**Link:** https://github.com/Kartikeya-guthub/Event-Driven-Order-Payment-Backend

**What problem does it solve?**  
In modern microservices architecture, ensuring data consistency across distributed services (like an order service and a payment service) is a major challenge. If an application updates its database but crashes before publishing a subsequent event to the message broker, the system is left in a fractured state. This project solves the dual-write problem by implementing the Transactional Outbox pattern. It guarantees that database state and domain events are always perfectly in sync, ensuring zero event loss and reliable, asynchronous communication even in the event of partial system failures.

**What did I specifically build?**  
I engineered the complete backend infrastructure for this system from scratch:
- **Core API & Architecture:** Built a robust Node.js/Express.js backend utilizing an event-driven flow.
- **Transactional Outbox Implementation:** Engineered atomic operations where order creations and domain events are saved to a PostgreSQL database within a single transaction.
- **Event Publisher System:** Developed a background worker (`src/publisher`) that reliably polls the database and pushes pending events to an Apache Kafka cluster.
- **Resilient Workers:** Created a Kafka consumer (`src/worker/consumer.js`) that processes incoming payment events asynchronously.
- **Idempotency & Concurrency:** Designed an idempotency framework (using a `processed_events` table) to safely discard duplicate Kafka messages, ensuring exactly-once processing semantics. Also implemented optimistic locking to prevent race conditions during state updates.

**What would I design differently today?**  
I would replace the database polling mechanism in the Outbox Publisher with Change Data Capture (CDC) using a tool like Debezium. In the current implementation, a background worker continually polls the PostgreSQL database for unpublished events. While effective, polling inherently introduces latency and places unnecessary continuous load on the database. By utilizing CDC to read directly from the database's write-ahead log (WAL) and stream changes to Kafka, the architecture would become far more efficient, real-time, and scalable under heavy load.

### Repository 2 — CollabHub
**Link:** https://github.com/Kartikeya-guthub/CollabHub

**What problem does it solve?**  
CollabHub provides a real-time, unified workspace that combines a collaborative code editor and an interactive whiteboard. It exists to solve the friction of switching between disconnected tools by bridging the gap between visual brainstorming and live coding. It keeps teams synchronized across both drawing and coding surfaces under a single environment and authentication model.

**What did I specifically build?**  
I architected and developed a unified real-time collaborative workspace. Specifically, I:
- Built the backend infrastructure utilizing a unified Postgres/JWT authentication layer for user identity and secure room management.
- Implemented a unified real-time synchronization engine using **Yjs**. Instead of running separate sync servers, I tied both the **Monaco Code Editor** (via `y-monaco`) and the **Excalidraw Whiteboard** (via `y-excalidraw`) into a single shared `Y.Doc`.
- Scaled the real-time infrastructure horizontally using Node.js, Socket.IO, and **Redis Pub/Sub**. Updates to the Yjs document are broadcast via a `yjs-rehydrate` Redis channel, ensuring perfectly synced CRDT state across multiple distributed server instances.
- Engineered a live code execution pipeline using Judge0 (with a Piston fallback) that instantly broadcasts test results to all participants in the room.
- Developed a multi-modal AI integration that goes beyond chat. It includes a smart code template generator that streams directly into the editor, and a Diagram Generator (powered by Gemini/NVIDIA Nemotron) that parses natural language and programmatically injects architectural shapes and connective arrows directly into the shared Excalidraw whiteboard.

**What would I design differently today?**  
Today, I would change how the AI streaming interacts with the collaborative code editor. Currently, when the AI auto-generates a code template, it temporarily unlocks the editor and injects the streaming chunks natively using Monaco's `executeEdits` API. While the `y-monaco` binding eventually picks this up, bypassing the Yjs data structure creates a subtle race condition: if a remote user types on the same line while the AI is streaming, the edits can conflict or interleave poorly. To fix this, I would stream the AI tokens *directly* into the `Y.Text` CRDT type via `ytext.insert()`. By treating the AI as just another "remote user" interacting natively with the CRDT, Yjs would perfectly handle all conflict resolution mathematically without locking the editor.

---

## Part 2 — Debugging Round

### Files

- `Part 2-Debug/original.ts` — original buggy Cloud Function provided in the assessment.
- `Part 2-Debug/fixed.ts` — corrected implementation.

### Bugs Identified

1. **Missing authentication/authorization check (Security)**  
   The original code lacked a `context.auth` check. Anyone could call the endpoint anonymously or maliciously spoof a `studentId` payload to book sessions on behalf of other users.

2. **Missing `async/await` on Firestore operations**  
   The handler missed the `async` keyword and failed to `await` the `.get()` and `.add()` promises. Without `await`, `existing` evaluates to a Promise (crashing at `.docs.length`), and failing to `await` the final `.add()` means the Cloud Function can terminate before the DB write finishes, causing data loss.

3. **Mismatched Collection Paths & Race Conditions (Logic)**  
   The query checked for conflicts in a subcollection (`teachers/{id}/bookings`) but wrote to the global root (`bookings`), guaranteeing the conflict check would always pass. Furthermore, a simple read-then-write pattern allows concurrent requests to double-book the same slot. I fixed this by unifying the paths, using the `slot` as a deterministic Document ID, and wrapping it all in a Firestore atomic transaction (`runTransaction`).

4. **Incorrect TypeScript Type Trust (Typing)**  
   The original function typed `data` directly as `BookingRequest`. In Firebase `onCall` functions, `data` is heavily untrusted user input (effectively `any`). By blindly trusting the TypeScript cast without manual runtime validation, missing fields (like an undefined `subject`) would crash the database write or corrupt records. I added explicit runtime `typeof` checks for all fields before casting.

---

## Part 3 — Session Reschedule Widget

**Location:** [Part 3/Session Reschedule Widget/](https://github.com/Kartikeya-guthub/Session-Reschedule-Widget/tree/main/Part%203/Session%20Reschedule%20Widget)

Implemented:

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Displays the student's next 3 upcoming sessions via a local Mock data layer
- Request Reschedule modal with accessible UI focus traps
- Custom Date/time slot picker component
- Reschedule reason dropdown typed against a strict TypeScript union type
- Mock `requestReschedule` Cloud Function handler simulating real backend latency and logic
- Shared TypeScript types between frontend and the mock backend
- Idempotency via UUID tracking to prevent duplicate submissions
- Stale-session detection using optimistic concurrency checks
- 2-hour tutoring lead-time restriction gracefully handled
- Parent's local timezone display accurately mapped across boundaries
- Strict UTC representation for session and reschedule datetime values
- Polished loading spinners, disabled states, and inline error banners
- Full Test Suite via Vitest covering date boundaries, DST logic, and handler validation
- Incremental Git commits showing progressive feature builds

### Timezone and Lead-Time Design

Session datetimes are strictly stored and communicated as UTC ISO-8601 strings so the underlying appointment represents one consistent instant in time regardless of the parent's actual location.

The UI intelligently converts that UTC value into the parent's local timezone for both display (`Intl.DateTimeFormat`) and HTML input selection (`datetime-local`). Reschedule slots within 2 hours of the current time are actively disabled in the UI (client-side validation), and the identical lead-time rule is enforced independently by the mock Cloud Function (server-side validation) to ensure it cannot be bypassed by malicious requests or stale open modals.

---

## Part 4 — Explain-It-Yourself Video

**Video:** [PASTE YOUR VIDEO LINK HERE]

The video demonstrates:

- Part 3 implementation
- Local time → UTC reasoning
- 2-hour lead-time logic
- An intentional timezone-related break
- Explanation of what breaks and why
