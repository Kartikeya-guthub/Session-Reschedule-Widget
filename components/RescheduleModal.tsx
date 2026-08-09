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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900">
            Reschedule Session
          </h2>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            ✕
          </button>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Rescheduling: <strong className="font-semibold">{session.subject}</strong> with {session.teacherName}
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 animate-in fade-in slide-in-from-top-1">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          <div className="flex flex-col gap-1">
            <label htmlFor="note-input" className="text-sm font-medium text-gray-700">
              Note (optional)
            </label>
            <textarea
              id="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
              rows={3}
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason || !newDatetimeUTC}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 min-w-[160px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Confirm Reschedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
