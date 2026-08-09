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
    // Skeleton loading state instead of blank
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[140px] animate-pulse rounded-2xl border border-orange-100 bg-orange-50/30"
          />
        ))}
      </div>
    );
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
      <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center shadow-sm">
        <p className="text-2xl mb-2">📚</p>
        <p className="text-base font-medium text-gray-700">No upcoming sessions</p>
        <p className="mt-1 text-sm text-gray-400">Check back later for new sessions.</p>
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
