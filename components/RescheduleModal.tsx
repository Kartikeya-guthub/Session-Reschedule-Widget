'use client';

import { Session, RescheduleReason } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import ReasonSelect from './ReasonSelect';
import TimeSlotPicker from './TimeSlotPicker';
import { requestReschedule } from '@/lib/firebase/functions';

interface RescheduleModalProps {
  session: Session;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onSuccess: () => void;
}

export default function RescheduleModal({ session, onClose, triggerRef, onSuccess }: RescheduleModalProps) {
  // Generated once per modal instance lifetime
  const [requestId] = useState(() => crypto.randomUUID());
  
  const [reason, setReason] = useState<RescheduleReason | ''>('');
  const [newDatetimeUTC, setNewDatetimeUTC] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const mountedRef = useRef(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Return focus to trigger on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      triggerRef.current?.focus();
    };
  }, [triggerRef]);

  // Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Simple Focus trap
  useEffect(() => {
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleTab);
    
    // Auto-focus first interactive element (close button in this case)
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
       focusable[0].focus();
    }
    
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !newDatetimeUTC) return;
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const res = await requestReschedule({
        sessionId: session.id,
        currentDatetimeUTC: session.datetimeUTC,
        newDatetimeUTC,
        reason,
        requestId,
        note: note.trim() || undefined,
      });

      if (mountedRef.current) {
        if (res.success) {
          onSuccess();
        } else {
          setErrorMsg(res.error || 'An unexpected error occurred.');
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setErrorMsg('Network error. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="animate-modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div 
        ref={modalRef}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        className="animate-modal-panel w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl scrollbar-thin"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-gray-900">
            Choose a new time
          </h2>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-orange-500 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-5 text-sm text-gray-500">
          Rescheduling <strong className="font-semibold text-gray-700">{session.subject}</strong> with {session.teacherName}
        </p>

        {errorMsg && (
          <div className="animate-fade-in mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TimeSlotPicker
            currentSessionUTC={session.datetimeUTC}
            selectedUTC={newDatetimeUTC}
            onSelectUTC={setNewDatetimeUTC}
            disabled={isSubmitting}
          />

          <ReasonSelect 
            value={reason} 
            onChange={setReason} 
            disabled={isSubmitting} 
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="note-input" className="text-sm font-medium text-gray-700">
              Note <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              placeholder="Any extra context for your tutor..."
              className="resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50 transition-colors"
              rows={2}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason || !newDatetimeUTC}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:shadow-none disabled:hover:bg-orange-500 min-w-[180px] flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending request…
                </>
              ) : (
                'Request reschedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
