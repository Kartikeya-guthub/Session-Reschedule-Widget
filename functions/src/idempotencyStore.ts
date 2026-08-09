import { RescheduleResponse } from '@/lib/types';

// A plain Map acting as our mock Redis/Firestore for idempotency keys.
// In a real deployed environment, this would be a persistent store keyed by the requestId.
// module-level — fine for a mock.
export const idempotencyStore = new Map<string, RescheduleResponse>();
