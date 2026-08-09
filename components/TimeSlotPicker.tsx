'use client';

import { useState, useMemo, useEffect } from 'react';
import { isWithinLeadTime } from '@/lib/time';

interface TimeSlotPickerProps {
  currentSessionUTC: string;
  selectedUTC: string | null;
  onSelectUTC: (utc: string) => void;
  disabled?: boolean;
}

export default function TimeSlotPicker({ currentSessionUTC, selectedUTC, onSelectUTC, disabled }: TimeSlotPickerProps) {
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [timeZone, setTimeZone] = useState<string>('');
  const [visibleReason, setVisibleReason] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setSelectedDateStr(`${yyyy}-${mm}-${dd}`);
    
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const slots = useMemo(() => {
    if (!selectedDateStr) return [];
    const generatedSlots = [];
    const [year, month, date] = selectedDateStr.split('-').map(Number);
    const now = new Date();
    
    // Generate slots every 30 mins from 08:00 to 20:00
    for (let hour = 8; hour <= 20; hour++) {
      for (let min of [0, 30]) {
        const slotDate = new Date(year, month - 1, date, hour, min, 0, 0);
        const slotUTC = slotDate.toISOString();
        
        let disabledReason: 'too-soon' | 'current-slot' | null = null;
        if (isWithinLeadTime(slotDate, now)) {
          disabledReason = 'too-soon';
        } else if (slotUTC === currentSessionUTC) {
          disabledReason = 'current-slot';
        }
        
        generatedSlots.push({
          utc: slotUTC,
          label: new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(slotDate),
          disabledReason
        });
      }
    }
    return generatedSlots;
  }, [selectedDateStr, currentSessionUTC]);

  const handleSlotInteraction = (slot: typeof slots[0]) => {
    if (slot.disabledReason === 'too-soon') {
      setVisibleReason("Too soon — reschedules require at least 2 hours' notice.");
    } else if (slot.disabledReason === 'current-slot') {
      setVisibleReason("This is already your scheduled time.");
    } else {
      setVisibleReason(null);
      if (!disabled) onSelectUTC(slot.utc);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="date-picker" className="mb-1 block text-sm font-medium text-gray-700">
          Select Date
        </label>
        <input 
          id="date-picker"
          type="date" 
          value={selectedDateStr}
          onChange={(e) => {
            setSelectedDateStr(e.target.value);
            setVisibleReason(null);
          }}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
        />
        {timeZone && (
          <p className="mt-1 text-xs text-gray-500">
            Times shown in your local timezone ({timeZone})
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 max-h-[180px] overflow-y-auto p-1 scrollbar-thin">
        {slots.map((slot) => {
          const isSelected = selectedUTC === slot.utc;
          const isSlotDisabled = slot.disabledReason !== null;
          
          return (
            <button
              key={slot.utc}
              type="button"
              onClick={() => handleSlotInteraction(slot)}
              onMouseEnter={() => isSlotDisabled && handleSlotInteraction(slot)}
              onMouseLeave={() => setVisibleReason(null)}
              onFocus={() => handleSlotInteraction(slot)}
              onBlur={() => setVisibleReason(null)}
              disabled={disabled} 
              aria-disabled={isSlotDisabled}
              className={`
                flex flex-col items-center justify-center rounded-lg border p-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500
                ${isSelected 
                  ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold' 
                  : isSlotDisabled 
                    ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'}
              `}
            >
              <span>{slot.label}</span>
            </button>
          );
        })}
      </div>

      <div className="h-4">
        {visibleReason && (
          <p className="text-xs font-medium text-amber-600 animate-in fade-in">
            {visibleReason}
          </p>
        )}
      </div>
    </div>
  );
}
