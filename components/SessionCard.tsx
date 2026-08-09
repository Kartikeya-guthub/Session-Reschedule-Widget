'use client';

import { Session } from '@/lib/types';
import StatusBadge from './StatusBadge';

function formatLocalDatetime(utcISO: string): string {
  const date = new Date(utcISO);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export default function SessionCard({ session }: { session: Session }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 leading-snug">
          {session.subject}
        </h3>
        <StatusBadge status={session.status} />
      </div>

      <p className="mb-1 text-sm text-gray-600">
        {session.teacherName}
      </p>

      <p className="text-sm text-gray-500">
        {formatLocalDatetime(session.datetimeUTC)}
      </p>
    </div>
  );
}
