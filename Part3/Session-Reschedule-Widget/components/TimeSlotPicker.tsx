'use client';

import { useState, useMemo, useEffect } from 'react';
import { isWithinLeadTime } from '@/lib/time';

interface TimeSlotPickerProps {
  currentSessionUTC: string;
  selectedUTC: string | null;
  onSelectUTC: (utc: string) => void;
  disabled?: boolean;
}

interface Slot {
  utc: string;
  hour: number;
  label: string;
  disabledReason: 'too-soon' | 'current-slot' | null;
}

export default function TimeSlotPicker({ currentSessionUTC, selectedUTC, onSelectUTC, disabled }: TimeSlotPickerProps) {
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [timeZone, setTimeZone] = useState<string>('');
  const [visibleReason, setVisibleReason] = useState<string | null>(null);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setSelectedDateStr(`${yyyy}-${mm}-${dd}`);
    
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Format date for styled display
  useEffect(() => {
    if (!selectedDateStr) return;
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    setFormattedDate(
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
    );
  }, [selectedDateStr]);

  const slots = useMemo(() => {
    if (!selectedDateStr) return [];
    const generatedSlots: Slot[] = [];
    const [year, month, date] = selectedDateStr.split('-').map(Number);
    const now = new Date();
    
    // Generate slots every 30 mins from 08:00 to 20:00
    for (let hour = 8; hour <= 20; hour++) {
      for (const min of [0, 30]) {
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
          hour,
          label: new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(slotDate),
          disabledReason,
        });
      }
    }
    return generatedSlots;
  }, [selectedDateStr, currentSessionUTC]);

  // Group slots: Morning (8-11:59), Afternoon (12-16:59), Evening (17-20)
  const morningSlots = slots.filter(s => s.hour < 12);
  const afternoonSlots = slots.filter(s => s.hour >= 12 && s.hour < 17);
  const eveningSlots = slots.filter(s => s.hour >= 17);

  const hasTooSoonSlots = slots.some(s => s.disabledReason === 'too-soon');

  const handleSlotInteraction = (slot: Slot) => {
    if (slot.disabledReason === 'too-soon') {
      setVisibleReason("Too soon — reschedules require at least 2 hours' notice.");
    } else if (slot.disabledReason === 'current-slot') {
      setVisibleReason("This is already your scheduled time.");
    } else {
      setVisibleReason(null);
      if (!disabled) onSelectUTC(slot.utc);
    }
  };

  // Format selected slot for display
  const selectedLabel = useMemo(() => {
    if (!selectedUTC) return null;
    const d = new Date(selectedUTC);
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  }, [selectedUTC]);

  function renderSlotGrid(slotsGroup: Slot[], groupLabel: string) {
    if (slotsGroup.length === 0) return null;
    return (
      <div className="flex flex-col gap-1.5">
        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{groupLabel}</h4>
        <div className="grid grid-cols-4 gap-1.5">
          {slotsGroup.map((slot) => {
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
                aria-label={
                  isSlotDisabled 
                    ? `${slot.label} — ${slot.disabledReason === 'too-soon' ? 'Too soon, requires 2 hours notice' : 'Already your scheduled time'}`
                    : slot.label
                }
                className={`
                  flex items-center justify-center rounded-lg border px-1.5 py-1.5 text-xs font-medium transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 focus-visible:outline-none
                  ${isSelected 
                    ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200' 
                    : isSlotDisabled 
                      ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 active:scale-95'}
                `}
              >
                {isSelected && <span className="mr-0.5 text-[10px]">✓</span>}
                <span className={isSlotDisabled && !isSelected ? 'line-through decoration-gray-300' : ''}>
                  {slot.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Date Selector */}
      <div>
        <label htmlFor="date-picker" className="mb-1.5 block text-sm font-medium text-gray-700">
          Select date
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base">📅</span>
          <input 
            id="date-picker"
            type="date" 
            value={selectedDateStr}
            onChange={(e) => {
              setSelectedDateStr(e.target.value);
              setVisibleReason(null);
            }}
            disabled={disabled}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50 transition-colors"
          />
        </div>
        {formattedDate && (
          <p className="mt-1 text-xs text-gray-400">{formattedDate}</p>
        )}
      </div>

      {/* Timezone notice */}
      {timeZone && (
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
          <span className="shrink-0 mt-0.5">🕐</span>
          <div>
            <p className="font-medium">Times shown in your local time · {timeZone}</p>
            <p className="text-blue-500 mt-0.5">Your selected time will be saved in UTC.</p>
          </div>
        </div>
      )}

      {/* Too-soon notice */}
      {hasTooSoonSlots && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
          <span className="shrink-0">⏰</span>
          <p>Some times are unavailable because reschedules require at least 2 hours&apos; notice.</p>
        </div>
      )}

      {/* Slot groups */}
      {renderSlotGrid(morningSlots, 'Morning')}
      {renderSlotGrid(afternoonSlots, 'Afternoon')}
      {renderSlotGrid(eveningSlots, 'Evening')}

      {/* Per-slot disabled reason */}
      <div className="min-h-[18px]">
        {visibleReason && (
          <p className="animate-fade-in text-xs font-medium text-amber-600">
            {visibleReason}
          </p>
        )}
      </div>

      {/* Selected time summary */}
      {selectedLabel && (
        <div className="animate-fade-in rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">New time</p>
          <p className="text-sm font-semibold text-orange-700 mt-0.5">{selectedLabel}</p>
        </div>
      )}
    </div>
  );
}
