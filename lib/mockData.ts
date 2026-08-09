import { Session } from './types';

// One session within the next 48h so Phase 4 lead-time logic has something to bite on.
// Current time reference: sessions are relative to a near-future window.
const now = new Date();
const hours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

export const mockSessions: Session[] = [
  {
    id: 'sess-001',
    subject: 'Calculus II — Integration Techniques',
    teacherName: 'Dr. Amara Osei',
    datetimeUTC: hours(18), // ~18 hours from now → inside 48h window
    status: 'confirmed',
  },
  {
    id: 'sess-002',
    subject: 'Organic Chemistry Lab',
    teacherName: 'Prof. Liam Chen',
    datetimeUTC: hours(72), // ~3 days out → outside 48h window
    status: 'confirmed',
  },
  {
    id: 'sess-003',
    subject: 'Intro to Philosophy — Ethics',
    teacherName: 'Dr. Sofia Reyes',
    datetimeUTC: hours(120), // ~5 days out
    status: 'pending_reschedule',
  },
];
