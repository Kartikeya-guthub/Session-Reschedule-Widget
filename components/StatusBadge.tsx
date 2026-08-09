'use client';

import { SessionStatus } from '@/lib/types';

const statusConfig: Record<SessionStatus, { label: string; bg: string; text: string }> = {
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
  },
  pending_reschedule: {
    label: 'Pending Reschedule',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
};

export default function StatusBadge({ status }: { status: SessionStatus }) {
  const { label, bg, text } = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg} ${text}`}
    >
      {label}
    </span>
  );
}
