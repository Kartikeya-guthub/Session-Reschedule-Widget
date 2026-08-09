import { Session } from './types';

function getUpcomingDate(daysFromNow: number, hour: number, minute: number = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const mockSessions: Session[] = [
  {
    id: 'sess-001',
    subject: 'Machine Learning for Children',
    teacherName: 'Dr. Amara Osei',
    datetimeUTC: getUpcomingDate(1, 16, 0), // Tomorrow at 4:00 PM (inside 48h window)
    status: 'confirmed',
  },
  {
    id: 'sess-002',
    subject: 'Web Development for Beginners',
    teacherName: 'Mr. Johnson',
    datetimeUTC: getUpcomingDate(3, 17, 30), // 3 days from now at 5:30 PM (outside 48h window)
    status: 'confirmed',
  },
  {
    id: 'sess-003',
    subject: 'Mathematics for Coding',
    teacherName: 'Dr. Sofia Reyes',
    datetimeUTC: getUpcomingDate(5, 19, 0), // 5 days from now at 7:00 PM
    status: 'pending_reschedule',
  },
];
