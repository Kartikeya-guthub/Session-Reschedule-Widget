'use client';

import { SessionStatus } from '@/lib/types';

const statusConfig: Record<SessionStatus, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  confirmed: {
    label: 'Confirmed',
    emoji: '🟢',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  pending_reschedule: {
    label: 'Reschedule pending',
    emoji: '🟠',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  cancelled: {
    label: 'Cancelled',
    emoji: '🔴',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

export default function StatusBadge({ status }: { status: SessionStatus }) {
  const { label, emoji, bg, text, border } = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bg} ${text} ${border}`}
    >
      <span className="text-[10px] leading-none">{emoji}</span>
      {label}
    </span>
  );
}
