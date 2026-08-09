'use client';

import { Session, RescheduleReason } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import ReasonSelect from './ReasonSelect';

interface RescheduleModalProps {
  session: Session;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function RescheduleModal({ session, onClose, triggerRef }: RescheduleModalProps) {
  // Generated once per modal instance lifetime
  const [requestId] = useState(() => crypto.randomUUID());
  
  const [reason, setReason] = useState<RescheduleReason | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    if (!reason) return;
    
    setIsSubmitting(true);
    
    // Simulate mock submission delay for the shell
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Guard against unmounted state updates
    if (mountedRef.current) {
      setIsSubmitting(false);
      onClose();
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Phase 4 Slot Picker Placeholder */}
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            [Slot Picker Placeholder - Phase 4]
          </div>

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
              disabled={isSubmitting || !reason}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
