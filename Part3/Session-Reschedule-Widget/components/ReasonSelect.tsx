'use client';

import { RescheduleReason } from '@/lib/types';

interface ReasonSelectProps {
  value: RescheduleReason | '';
  onChange: (reason: RescheduleReason) => void;
  disabled?: boolean;
}

const REASONS: RescheduleReason[] = ['Conflict', 'Illness', 'Time zone', 'Other'];

export default function ReasonSelect({ value, onChange, disabled }: ReasonSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="reason-select" className="text-sm font-medium text-gray-700">
        Reason for rescheduling
      </label>
      <select
        id="reason-select"
        value={value}
        onChange={(e) => onChange(e.target.value as RescheduleReason)}
        disabled={disabled}
        className="appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-900 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50 transition-colors cursor-pointer"
      >
        <option value="" disabled>Select a reason…</option>
        {REASONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
