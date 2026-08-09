'use client';

import { Session } from '@/lib/types';
import SessionCard from './SessionCard';
import { useEffect, useState } from 'react';

export default function SessionList({ sessions }: { sessions: Session[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevents hydration mismatch before client takes over
  }

  const upcoming = sessions
    .filter(
      (s) =>
        new Date(s.datetimeUTC).getTime() > Date.now() &&
        s.status !== 'cancelled'
    )
    .sort(
      (a, b) =>
        new Date(a.datetimeUTC).getTime() - new Date(b.datetimeUTC).getTime()
    )
    .slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-10 text-center shadow-sm">
        <p className="text-base text-gray-500">No upcoming sessions</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {upcoming.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}
