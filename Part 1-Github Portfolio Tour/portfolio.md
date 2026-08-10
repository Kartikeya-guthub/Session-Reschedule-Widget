# GitHub Portfolio Walkthrough

## GitHub Profile

https://github.com/Kartikeya-guthub

---

## Repository 1 — Event-Driven Order & Payment System

**Repository:** https://github.com/Kartikeya-guthub/Event-Driven-Order-Payment-Backend

### What problem does it solve?

In modern microservices architecture, ensuring data consistency across distributed services (like an order service and a payment service) is a major challenge. If an application updates its database but crashes before publishing a subsequent event to the message broker, the system is left in a fractured state. This project solves the dual-write problem by implementing the Transactional Outbox pattern. It guarantees that database state and domain events are always perfectly in sync, ensuring zero event loss and reliable, asynchronous communication even in the event of partial system failures.

### What did I specifically build?

I engineered the complete backend infrastructure for this system from scratch:
- **Core API & Architecture:** Built a robust Node.js/Express.js backend utilizing an event-driven flow.
- **Transactional Outbox Implementation:** Engineered atomic operations where order creations and domain events are saved to a PostgreSQL database within a single transaction.
- **Event Publisher System:** Developed a background worker (`src/publisher`) that reliably polls the database and pushes pending events to an Apache Kafka cluster.
- **Resilient Workers:** Created a Kafka consumer (`src/worker/consumer.js`) that processes incoming payment events asynchronously.
- **Idempotency & Concurrency:** Designed an idempotency framework (using a `processed_events` table) to safely discard duplicate Kafka messages, ensuring exactly-once processing semantics. Also implemented optimistic locking to prevent race conditions during state updates.

### What would I design differently today?

I would replace the database polling mechanism in the Outbox Publisher with Change Data Capture (CDC) using a tool like Debezium. In the current implementation, a background worker continually polls the PostgreSQL database for unpublished events. While effective, polling inherently introduces latency and places unnecessary continuous load on the database. By utilizing CDC to read directly from the database's write-ahead log (WAL) and stream changes to Kafka, the architecture would become far more efficient, real-time, and scalable under heavy load.

---

## Repository 2 — CollabHub

**Repository:** https://github.com/Kartikeya-guthub/CollabHub

### What problem does it solve?

CollabHub provides a real-time, unified workspace that combines a collaborative code editor and an interactive whiteboard. It exists to solve the friction of switching between disconnected tools by bridging the gap between visual brainstorming and live coding. It keeps teams synchronized across both drawing and coding surfaces under a single environment and authentication model.

### What did I specifically build?

I architected and developed a unified real-time collaborative workspace. Specifically, I:
- Built the backend infrastructure utilizing a unified Postgres/JWT authentication layer for user identity and secure room management.
- Implemented a unified real-time synchronization engine using **Yjs**. Instead of running separate sync servers, I tied both the **Monaco Code Editor** (via `y-monaco`) and the **Excalidraw Whiteboard** (via `y-excalidraw`) into a single shared `Y.Doc`.
- Scaled the real-time infrastructure horizontally using Node.js, Socket.IO, and **Redis Pub/Sub**. Updates to the Yjs document are broadcast via a `yjs-rehydrate` Redis channel, ensuring perfectly synced CRDT state across multiple distributed server instances.
- Engineered a live code execution pipeline using Judge0 (with a Piston fallback) that instantly broadcasts test results to all participants in the room.
- Developed a multi-modal AI integration that goes beyond chat. It includes a smart code template generator that streams directly into the editor, and a Diagram Generator (powered by Gemini/NVIDIA Nemotron) that parses natural language and programmatically injects architectural shapes and connective arrows directly into the shared Excalidraw whiteboard.

### What would I design differently today?

Today, I would change how the AI streaming interacts with the collaborative code editor. Currently, when the AI auto-generates a code template, it temporarily unlocks the editor and injects the streaming chunks natively using Monaco's `executeEdits` API. While the `y-monaco` binding eventually picks this up, bypassing the Yjs data structure creates a subtle race condition: if a remote user types on the same line while the AI is streaming, the edits can conflict or interleave poorly. To fix this, I would stream the AI tokens *directly* into the `Y.Text` CRDT type via `ytext.insert()`. By treating the AI as just another "remote user" interacting natively with the CRDT, Yjs would perfectly handle all conflict resolution mathematically without locking the editor.
