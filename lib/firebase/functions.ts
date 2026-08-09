import { RescheduleRequestPayload, RescheduleResponse } from '../types';
import { requestRescheduleHandler } from '../../functions/src/requestReschedule';

// Mock callable with the same signature Firebase’s httpsCallable would have,
// plus a setTimeout to simulate real latency — otherwise Phase 6’s loading state has nothing to show.
export async function requestReschedule(payload: RescheduleRequestPayload): Promise<RescheduleResponse> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  // Call the mock function handler directly
  return requestRescheduleHandler(payload);
}
