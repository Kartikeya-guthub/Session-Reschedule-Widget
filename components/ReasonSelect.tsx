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
    <div className="flex flex-col gap-1">
      <label htmlFor="reason-select" className="text-sm font-medium text-gray-700">
        Reason for rescheduling
      </label>
      <select
        id="reason-select"
        value={value}
        onChange={(e) => onChange(e.target.value as RescheduleReason)}
        disabled={disabled}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
      >
        <option value="" disabled>Select a reason...</option>
        {REASONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
